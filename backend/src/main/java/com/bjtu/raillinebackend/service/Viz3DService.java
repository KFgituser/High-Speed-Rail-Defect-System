package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.dto.Viz3DLatestResponse;
import com.bjtu.raillinebackend.dto.Viz3DJobStatusResponse;
import com.bjtu.raillinebackend.dto.Viz3DStartRequest;
import com.bjtu.raillinebackend.exception.ResourceNotFoundException;
import com.bjtu.raillinebackend.repository.VizSlotRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.scheduling.annotation.Scheduled;
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
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashSet;
import java.util.Set;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import jakarta.annotation.PreDestroy;

@Service
public class Viz3DService {
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private final VizSlotRepository slotRepository;
    private final AsyncTaskExecutor visualizationTaskExecutor;

    public Viz3DService(VizSlotRepository slotRepository,
                        @Qualifier("visualizationTaskExecutor") AsyncTaskExecutor visualizationTaskExecutor) {
        this.slotRepository = slotRepository;
        this.visualizationTaskExecutor = visualizationTaskExecutor;
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

    @Value("${app.visualization.sse-timeout-ms:900000}")
    private long sseTimeoutMs;

    @Value("${app.visualization.process-timeout-ms:300000}")
    private long processTimeoutMs;

    @Value("${viz3d.buffer-lines:500}")
    private int maxBufferedLogLines;

    @Value("${app.visualization.completed-job-retention-ms:3600000}")
    private long completedJobRetentionMs;

    private final ConcurrentHashMap<String, JobContext> jobs = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, AtomicBoolean> slotRunning = new ConcurrentHashMap<>();
    private final ScheduledExecutorService timeoutScheduler = Executors.newSingleThreadScheduledExecutor(task -> {
        Thread thread = new Thread(task, "viz3d-timeout");
        thread.setDaemon(true);
        return thread;
    });

    public String start3D(Viz3DStartRequest req) {
        int slotId = req.getSlotId();
        if (slotId < 1 || slotId > 4) {
            throw new IllegalArgumentException("slotId must be 1..4");
        }
        AtomicBoolean running = slotRunning.computeIfAbsent(slotId, ignored -> new AtomicBoolean());
        if (!running.compareAndSet(false, true)) {
            throw new IllegalStateException("This slot already has a queued or running 3D task");
        }

        String runUuid = UUID.randomUUID().toString();
        JobContext job = new JobContext(runUuid, slotId);
        jobs.put(runUuid, job);
        log(job, "QUEUED");
        try {
            visualizationTaskExecutor.execute(() -> run3D(job, normalizeLang(req.getLang())));
            return runUuid;
        } catch (RuntimeException exception) {
            jobs.remove(runUuid);
            running.set(false);
            throw new IllegalStateException("Visualization task queue is full", exception);
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

    private void run3D(JobContext job, String lang) {
        Process process = null;
        ScheduledFuture<?> timeout = null;
        AtomicBoolean timedOut = new AtomicBoolean(false);
        String result = "error";
        Path runDir = Paths.get(out3dRoot).resolve("slot-" + job.slotId).resolve("run-" + job.runUuid);
        job.status = "running";
        try {
            Files.createDirectories(runDir);
            copy2dArtifactsTo(runDir, job.slotId);

            ProcessBuilder pb = new ProcessBuilder(pythonExe, "-u", scriptPath)
                    .directory(runDir.toFile())
                    .redirectErrorStream(true);
            var env = pb.environment();
            env.put("VIZ_OUT_DIR", runDir.toString());
            env.put("RUN_UUID", job.runUuid);
            env.put("VIZ_LANG", lang);
            env.put("MPLBACKEND", "Agg");
            env.put("PYTHONIOENCODING", "UTF-8");
            env.put("PYTHONUTF8", "1");
            log(job, "[3D] cmd=" + pb.command());
            log(job, "[3D] workDir=" + runDir);

            process = pb.start();
            Process startedProcess = process;
            timeout = timeoutScheduler.schedule(() -> {
                if (startedProcess.isAlive()) {
                    timedOut.set(true);
                    startedProcess.destroyForcibly();
                }
            }, Math.max(1000, processTimeoutMs), TimeUnit.MILLISECONDS);

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log(job, line);
                }
            }
            int code = process.waitFor();
            log(job, "EXIT " + code);
            Path img = runDir.resolve("image3D.png");
            if (timedOut.get()) {
                result = "timeout";
                log(job, "ERROR: 3D visualization timed out");
            } else if (code == 0 && Files.isRegularFile(img)) {
                result = "success";
            } else {
                log(job, "ERROR: image3D.png not generated or process failed");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log(job, "ERROR: 3D visualization interrupted");
        } catch (Exception exception) {
            if (timedOut.get()) {
                result = "timeout";
                log(job, "ERROR: 3D visualization timed out");
            } else {
                log(job, "ERROR: " + exception.getMessage());
            }
        } finally {
            if (timeout != null) timeout.cancel(false);
            if (process != null && process.isAlive()) process.destroyForcibly();
            try {
                complete(job, result);
            } finally {
                slotRunning.get(job.slotId).set(false);
            }
        }
    }

    public SseEmitter openStream(String runUuid) {
        JobContext job = findJob(runUuid);
        SseEmitter emitter = new SseEmitter(sseTimeoutMs);
        emitter.onCompletion(() -> removeEmitter(job, emitter));
        emitter.onTimeout(() -> removeEmitter(job, emitter));
        emitter.onError(error -> removeEmitter(job, emitter));
        synchronized (job) {
            try {
                for (String line : job.logs) {
                    emitter.send(SseEmitter.event().name("log").data(line));
                }
                if (job.completedAt > 0) {
                    emitter.send(SseEmitter.event().name("done").data(job.status));
                    emitter.complete();
                } else {
                    job.emitters.add(emitter);
                }
            } catch (IOException exception) {
                emitter.completeWithError(exception);
            }
        }
        return emitter;
    }

    public Viz3DJobStatusResponse getStatus(String runUuid) {
        JobContext job = findJob(runUuid);
        return new Viz3DJobStatusResponse(job.runUuid, job.slotId, job.status);
    }

    private JobContext findJob(String runUuid) {
        JobContext job = jobs.get(runUuid);
        if (job == null) throw new ResourceNotFoundException("3D visualization job", runUuid);
        return job;
    }

    private void removeEmitter(JobContext job, SseEmitter emitter) {
        synchronized (job) {
            job.emitters.remove(emitter);
        }
    }

    private void log(JobContext job, String line) {
        synchronized (job) {
            job.logs.addLast(line);
            while (job.logs.size() > Math.max(1, maxBufferedLogLines)) job.logs.removeFirst();
            for (SseEmitter emitter : new ArrayList<>(job.emitters)) {
                try {
                    emitter.send(SseEmitter.event().name("log").data(line));
                } catch (Exception exception) {
                    job.emitters.remove(emitter);
                }
            }
        }
    }

    private void complete(JobContext job, String status) {
        synchronized (job) {
            job.status = status;
            job.completedAt = System.currentTimeMillis();
            for (SseEmitter emitter : job.emitters) {
                try {
                    emitter.send(SseEmitter.event().name("done").data(status));
                } catch (Exception ignored) {
                    // The client may have disconnected.
                }
                emitter.complete();
            }
            job.emitters.clear();
        }
    }

    @Scheduled(fixedDelayString = "${app.visualization.completed-job-cleanup-interval-ms:300000}")
    void removeExpiredJobs() {
        long cutoff = System.currentTimeMillis() - completedJobRetentionMs;
        jobs.entrySet().removeIf(entry -> entry.getValue().completedAt > 0
                && entry.getValue().completedAt < cutoff);
    }

    @PreDestroy
    void shutdownTimeoutScheduler() {
        timeoutScheduler.shutdownNow();
    }

    private static final class JobContext {
        final String runUuid;
        final int slotId;
        final Deque<String> logs = new ArrayDeque<>();
        final Set<SseEmitter> emitters = new HashSet<>();
        volatile String status = "queued";
        volatile long completedAt;

        JobContext(String runUuid, int slotId) {
            this.runUuid = runUuid;
            this.slotId = slotId;
        }
    }

    // ===== latest：扫目录找最新 run 且必须有 image3D.png =====
    public Viz3DLatestResponse getLatest(int slotId) {
        Path slotDir = Paths.get(out3dRoot).resolve("slot-" + slotId);
        if (!Files.isDirectory(slotDir)) return Viz3DLatestResponse.empty(slotId);

        try (var runs = Files.list(slotDir)) {
            Optional<Path> latestRun = runs
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
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("getLatest failed: " + e.getMessage(), e);
        }
    }
}
