package com.bjtu.raillinebackend.service;


import com.bjtu.raillinebackend.dto.LatestVizResponse;
import com.bjtu.raillinebackend.repository.VizSlotRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class VizRun3DAmpService {
    private final VizSlotRepository slotRepository;

    public VizRun3DAmpService(VizSlotRepository slotRepository) {
        this.slotRepository = slotRepository;
    }

    @Value("${viz3damp.python}")
    private String python;

    @Value("${viz3damp.script-path}")
    private String scriptPath;

    @Value("${viz3damp.source-2d-dir}")
    private String source2dDir;

    @Value("${viz3damp.base-out-dir}")
    private String baseOutDir;

    private final ExecutorService pool = Executors.newFixedThreadPool(4);

    private final ConcurrentHashMap<Integer, AtomicBoolean> slotRunning = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, JobCtx> jobs = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, LatestVizResponse> latestBySlot = new ConcurrentHashMap<>();

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public String start(int slotId, String lang) {
        if (slotId < 1 || slotId > 4) throw new IllegalArgumentException("slotId must be 1..4");
        slotRunning.putIfAbsent(slotId, new AtomicBoolean(false));
        if (!slotRunning.get(slotId).compareAndSet(false, true)) {
            throw new IllegalStateException("该槽位正在生成中");
        }

        String runUuid = UUID.randomUUID().toString();
        JobCtx ctx = new JobCtx(runUuid, slotId);
        ctx.lang = normalizeLang(lang);
        jobs.put(runUuid, ctx);

        pool.submit(() -> runPython(ctx));
        return runUuid;
    }

    public SseEmitter stream(String runUuid) {
        JobCtx ctx = jobs.get(runUuid);
        SseEmitter emitter = new SseEmitter(0L);

        if (ctx == null) {
            try {
                emitter.send(SseEmitter.event().name("log").data("ERROR runUuid not found"));
                emitter.send(SseEmitter.event().name("done").data("DONE"));
            } catch (Exception ignored) {}
            emitter.complete();
            return emitter;
        }

        ctx.emitter = emitter;

        // 先补发缓冲日志
        for (String line : ctx.logBuffer) {
            try { emitter.send(SseEmitter.event().name("log").data(line)); } catch (Exception ignored) {}
        }
        if (ctx.done) {
            try { emitter.send(SseEmitter.event().name("done").data("DONE")); } catch (Exception ignored) {}
            emitter.complete();
        }

        emitter.onCompletion(() -> ctx.emitter = null);
        emitter.onError((e) -> ctx.emitter = null);
        emitter.onTimeout(() -> ctx.emitter = null);

        return emitter;
    }

    public LatestVizResponse latest(int slotId) {
        LatestVizResponse latest = latestBySlot.getOrDefault(slotId, new LatestVizResponse());
        if (latest.getImageUrl() == null || latest.getImageUrl().isBlank()) {
            Path outPng = Path.of(baseOutDir, "slot" + slotId, "image3D_amp.png").toAbsolutePath().normalize();
            if (Files.exists(outPng)) {
                latest.setImageUrl("/viz3damp-out/slot" + slotId + "/image3D_amp.png");
                try {
                    latest.setDate(Files.getLastModifiedTime(outPng).toInstant()
                            .atZone(java.time.ZoneId.systemDefault())
                            .format(DT));
                } catch (IOException ignored) {}
            }
        }
        if (latest.getImageUrl() != null && !latest.getImageUrl().isBlank()) {
            enrichSlotRange(latest, slotId);
        }
        return latest;
    }

    private void runPython(JobCtx ctx) {
        int slotId = ctx.slotId;
        try {
            Path outDir = Path.of(baseOutDir, "slot" + slotId).toAbsolutePath().normalize();
            Files.createDirectories(outDir);

            // 输出文件固定名（前端下载用 title + .png，不影响）
            Path outPng = outDir.resolve("image3D_amp.png");

            Path dataDir = resolveSlotDataDir(slotId);

            List<String> cmd = List.of(
                    python,
                    Path.of(scriptPath).toAbsolutePath().normalize().toString(),
                    "--data_dir", dataDir.toString(),
                    "--out", outPng.toString(),
                    "--lang", ctx.lang
            );

            log(ctx, "CMD: " + String.join(" ", cmd));

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Map<String, String> env = pb.environment();
            env.put("VIZ_LANG", ctx.lang);
            env.put("MPLBACKEND", "Agg");
            env.put("PYTHONIOENCODING", "UTF-8");
            env.put("PYTHONUTF8", "1");
            Process p = pb.start();

            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = br.readLine()) != null) {
                    log(ctx, line);
                }
            }

            int code = p.waitFor();
            log(ctx, "EXIT " + code);

            if (code == 0 && Files.exists(outPng)) {
                LatestVizResponse latest = new LatestVizResponse();
                latest.setImageUrl("/viz3damp-out/slot" + slotId + "/image3D_amp.png");
                latest.setDate(LocalDateTime.now().format(DT));
                enrichSlotRange(latest, slotId);
                latestBySlot.put(slotId, latest);
                done(ctx);
            } else {
                log(ctx, "ERROR 生成失败或图片不存在: " + outPng);
                error(ctx);
            }
        } catch (Exception e) {
            log(ctx, "ERROR " + e.getMessage());
            error(ctx);
        } finally {
            slotRunning.get(slotId).set(false);
        }
    }

    private String normalizeLang(String lang) {
        return lang != null && lang.toLowerCase().startsWith("en") ? "en" : "zh";
    }

    private Path resolveSlotDataDir(int slotId) throws IOException {
        Path slotDataDir = Path.of(source2dDir, "slot" + slotId).toAbsolutePath().normalize();
        Path amps = slotDataDir.resolve("amps_stack.npy");
        Path labels = slotDataDir.resolve("x_labels.npy");
        if (Files.exists(amps) && Files.exists(labels)) {
            return slotDataDir;
        }
        throw new FileNotFoundException("Slot " + slotId + " has no independent 2D amplitude data. Please generate 2D and save it to this slot first: " + slotDataDir);
    }

    private void enrichSlotRange(LatestVizResponse latest, int slotId) {
        slotRepository.findBySlotId(slotId).ifPresent(slot -> {
            latest.setStartLabel(slot.getStartLabel());
            latest.setEndLabel(slot.getEndLabel());
        });
    }

    private void log(JobCtx ctx, String line) {
        ctx.logBuffer.add(line);
        SseEmitter emitter = ctx.emitter;
        if (emitter != null) {
            try { emitter.send(SseEmitter.event().name("log").data(line)); }
            catch (Exception ignored) {}
        }
    }

    private void done(JobCtx ctx) {
        ctx.done = true;
        if (ctx.emitter != null) {
            try { ctx.emitter.send(SseEmitter.event().name("done").data("DONE")); }
            catch (Exception ignored) {}
            ctx.emitter.complete();
        }
    }

    private void error(JobCtx ctx) {
        ctx.done = true;
        if (ctx.emitter != null) {
            try {
                ctx.emitter.send(SseEmitter.event().name("log").data("ERROR"));
                ctx.emitter.send(SseEmitter.event().name("done").data("DONE"));
            } catch (Exception ignored) {}
            ctx.emitter.complete();
        }
    }

    private static class JobCtx {
        final String runUuid;
        final int slotId;
        String lang = "zh";
        volatile SseEmitter emitter;
        final List<String> logBuffer = new CopyOnWriteArrayList<>();
        volatile boolean done = false;

        JobCtx(String runUuid, int slotId) {
            this.runUuid = runUuid;
            this.slotId = slotId;
        }
    }
}
