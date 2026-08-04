package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.dto.Viz3DLatestResponse;
import com.bjtu.raillinebackend.dto.Viz3DStartRequest;
import com.bjtu.raillinebackend.repository.VizSlotRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class Viz3DService {
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private final VizSlotRepository slotRepository;

    public Viz3DService(VizSlotRepository slotRepository) {
        this.slotRepository = slotRepository;
    }

    // ======== 按你的真实环境写死（也可改成 application.yml 配置） ========
    @Value("${viz3d.python}")
    private String pythonExe;

    @Value("${viz3d.script-path}")
    private String scriptPath;

    // 2D 产物真实目录（amps_stack.npy 等就在这里）
    @Value("${viz3d.source-2d-dir}")
    private String artifacts2dDir;

    // 3D 输出根目录（你要求映射到 /viz3d-out/**）
    @Value("${viz3d.base-out-dir}")
    private String out3dRoot;

    // ===== SSE =====
    private final Map<String, SseEmitter> emitterMap = new ConcurrentHashMap<>();

    public String start3D(Viz3DStartRequest req) {
        int slotId = req.getSlotId();
        if (slotId < 1 || slotId > 4) {
            throw new IllegalArgumentException("slotId must be 1..4");
        }

        String runUuid = UUID.randomUUID().toString();
        Path runDir = Paths.get(out3dRoot).resolve("slot-" + slotId).resolve("run-" + runUuid);

        try {
            Files.createDirectories(runDir);

            // 1) 复制 2D 产物到 runDir（Python 就从 VIZ_OUT_DIR 读这些）
            copy2dArtifactsTo(runDir, slotId);

            // 2) 启动 Python
            ProcessBuilder pb = new ProcessBuilder(
                    pythonExe,
                    "-u",
                    scriptPath
            );

            pb.directory(runDir.toFile());

            // 关键：合并 stderr 到 stdout，否则“脚本路径错误/依赖错误”你看不到
            pb.redirectErrorStream(true);

            Map<String, String> env = pb.environment();
            env.put("VIZ_OUT_DIR", runDir.toString());
            env.put("RUN_UUID", runUuid);
            env.put("VIZ_LANG", normalizeLang(req.getLang()));

            // 建议强制无界面后端（保存 png 不需要 GUI）
            env.put("MPLBACKEND", "Agg");

            // 避免中文乱码
            env.put("PYTHONIOENCODING", "UTF-8");
            env.put("PYTHONUTF8", "1");

            sendSseLog(runUuid, "[3D] cmd=" + pb.command());
            sendSseLog(runUuid, "[3D] workDir=" + runDir);
            sendSseLog(runUuid, "[3D] VIZ_OUT_DIR=" + env.get("VIZ_OUT_DIR"));

            Process p = pb.start();

            // 3) 读日志 + 等结束（异步线程）
            new Thread(() -> monitorProcess(p, runUuid, runDir)).start();

            return runUuid;
        } catch (Exception e) {
            throw new RuntimeException("start3D failed: " + e.getMessage(), e);
        }
    }

    private String normalizeLang(String lang) {
        return lang != null && lang.toLowerCase().startsWith("en") ? "en" : "zh";
    }

    private void copy2dArtifactsTo(Path runDir, int slotId) throws Exception {
        // 你的脚本至少需要这三个；defects.json 可选但建议带上
        String[] required = {
                "amps_stack.npy",
                "x_labels.npy",
                "total_time_seconds.npy",
                "defects.json",
                "y_ticks_like_2d.npy"
        };

        Path slotDataDir = Paths.get(artifacts2dDir).resolve("slot" + slotId).toAbsolutePath().normalize();
        if (!Files.exists(slotDataDir.resolve("amps_stack.npy")) || !Files.exists(slotDataDir.resolve("x_labels.npy"))) {
            throw new RuntimeException("Slot " + slotId + " has no independent 2D amplitude data. Please generate 2D and save it to this slot first: " + slotDataDir);
        }

        for (String name : required) {
            Path src = slotDataDir.resolve(name);
            if (Files.exists(src)) {
                Files.copy(src, runDir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            }
        }
    }

    private void monitorProcess(Process process, String runUuid, Path runDir) {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8)
        )) {
            String line;
            while ((line = reader.readLine()) != null) {
                sendSseLog(runUuid, line);
            }

            int code = process.waitFor();
            sendSseLog(runUuid, "EXIT " + code);

            // 检查输出是否存在
            Path img = runDir.resolve("image3D.png");
            Path json = runDir.resolve("3Drun_result.json");
            if (code == 0 && Files.exists(img)) {
                sendSseLog(runUuid, "DONE");
            } else {
                sendSseLog(runUuid, "ERROR: image3D.png not generated. imgExists=" + Files.exists(img) +
                        ", jsonExists=" + Files.exists(json));
            }
        } catch (Exception e) {
            sendSseLog(runUuid, "ERROR monitor: " + e.getMessage());
        } finally {
            completeSse(runUuid);
        }
    }

    // ===== SSE: Controller 会调这个 =====
    // 监听日志流
    public SseEmitter openStream(String runUuid) {
        if (runUuid == null || runUuid.isBlank()) {
            throw new IllegalArgumentException("runUuid is blank");
        }

        // 创建 SseEmitter 时指定超时为 0L，表示永不超时
        SseEmitter emitter = emitterMap.computeIfAbsent(runUuid, k -> new SseEmitter(0L)); // 0L 防止超时

        emitter.onCompletion(() -> emitterMap.remove(runUuid));
        emitter.onTimeout(() -> emitterMap.remove(runUuid));
        emitter.onError(e -> emitterMap.remove(runUuid));

        return emitter;
    }

    // 发送日志消息
    public void sendSseLog(String runUuid, String line) {
        SseEmitter emitter = emitterMap.get(runUuid);
        if (emitter == null) return;
        try {
            emitter.send(SseEmitter.event().name("log").data(line));
        } catch (IOException ignored) {
            emitterMap.remove(runUuid);
        }
    }

    public void completeSse(String runUuid) {
        SseEmitter emitter = emitterMap.remove(runUuid);
        if (emitter == null) return;
        try {
            emitter.send(SseEmitter.event().name("done").data("DONE"));
        } catch (IOException ignored) {}
        emitter.complete();
    }

    // ===== latest：扫目录找最新 run 且必须有 image3D.png =====
    public Viz3DLatestResponse getLatest(int slotId) {
        Path slotDir = Paths.get(out3dRoot).resolve("slot-" + slotId);
        if (!Files.isDirectory(slotDir)) return Viz3DLatestResponse.empty(slotId);

        try {
            Optional<Path> latestRun = Files.list(slotDir)
                    .filter(Files::isDirectory)
                    .filter(p -> p.getFileName().toString().startsWith("run-"))
                    .filter(p -> Files.exists(p.resolve("image3D.png"))) // 关键：必须有图才算最新
                    .max(Comparator.comparingLong(p -> p.toFile().lastModified()));

            if (latestRun.isEmpty()) return Viz3DLatestResponse.empty(slotId);

            String runFolder = latestRun.get().getFileName().toString(); // run-xxxx
            String runUuid = runFolder.substring("run-".length());

            Path imagePath = latestRun.get().resolve("image3D.png");
            String imageUrl = "/viz3d-out/slot-" + slotId + "/" + runFolder
                    + "/image3D.png?t=" + System.currentTimeMillis();
            String date = Files.getLastModifiedTime(imagePath).toInstant()
                    .atZone(ZoneId.systemDefault())
                    .format(DT);

            String startLabel = slotRepository.findBySlotId(slotId)
                    .map(slot -> slot.getStartLabel())
                    .orElse(null);
            String endLabel = slotRepository.findBySlotId(slotId)
                    .map(slot -> slot.getEndLabel())
                    .orElse(null);

            return new Viz3DLatestResponse(slotId, runUuid, imageUrl, date, startLabel, endLabel);
        } catch (Exception e) {
            throw new RuntimeException("getLatest failed: " + e.getMessage(), e);
        }
    }
}
