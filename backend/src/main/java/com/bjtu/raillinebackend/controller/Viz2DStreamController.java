package com.bjtu.raillinebackend.controller;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.validation.constraints.Size;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

@Validated
@RestController
@RequestMapping("/api/viz")
public class Viz2DStreamController {
    @Value("${viz.python}")
    private String pythonExe;

    @Value("${viz.script2d}")
    private String script2d;

    @Value("${viz.workDir}")
    private String workDir;

    @Value("${viz.outDir}")
    private String outDir;

    @Value("${app.data.npyDir}")
    private String npyDir;

    @Value("${app.visualization.sse-timeout-ms:900000}")
    private long sseTimeoutMs;

    private final AsyncTaskExecutor visualizationTaskExecutor;

    public Viz2DStreamController(@Qualifier("visualizationTaskExecutor") AsyncTaskExecutor visualizationTaskExecutor) {
        this.visualizationTaskExecutor = visualizationTaskExecutor;
    }

    @GetMapping(path = "/run2d/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR')")
    public SseEmitter run2dStream(
            @RequestParam(value = "file", required = false) @Size(max = 255) String file,
            @RequestParam(value = "lang", required = false) @Size(max = 8) String lang) {
        String singleInput = normalizeAndValidateFile(file);
        SseEmitter emitter = new SseEmitter(sseTimeoutMs);
        AtomicReference<Process> processReference = new AtomicReference<>();
        AtomicReference<Future<?>> taskReference = new AtomicReference<>();
        AtomicBoolean cancelled = new AtomicBoolean(false);

        Runnable cancel = () -> {
            if (!cancelled.compareAndSet(false, true)) {
                return;
            }
            Process process = processReference.get();
            if (process != null && process.isAlive()) {
                process.destroyForcibly();
            }
            Future<?> task = taskReference.get();
            if (task != null) {
                task.cancel(true);
            }
        };
        emitter.onCompletion(cancel);
        emitter.onTimeout(cancel);
        emitter.onError(error -> cancel.run());

        try {
            Future<?> task = visualizationTaskExecutor.submit(
                    () -> runVisualization(emitter, processReference, cancelled, singleInput, lang));
            taskReference.set(task);
            if (cancelled.get()) {
                task.cancel(true);
            }
        } catch (RuntimeException exception) {
            emitter.completeWithError(new IllegalStateException("Visualization task queue is full"));
        }
        return emitter;
    }

    private void runVisualization(SseEmitter emitter, AtomicReference<Process> processReference,
                                  AtomicBoolean cancelled, String singleInput, String lang) {
        Process process = null;
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(pythonExe, script2d)
                    .directory(new File(workDir));
            Map<String, String> environment = processBuilder.environment();
            environment.put("MPLBACKEND", "Agg");
            environment.put("VIZ_OUT_DIR", outDir);
            environment.put("MPLCONFIGDIR", new File(outDir, ".matplotlib").getAbsolutePath());
            environment.put("VIZ_NPY_DIR", npyDir);
            environment.put("VIZ_LANG", normalizeLang(lang));
            if (StringUtils.hasText(singleInput)) {
                environment.put("VIZ_INPUT_FILE", singleInput);
            }
            processBuilder.redirectErrorStream(true);

            process = processBuilder.start();
            processReference.set(process);
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null && !cancelled.get()) {
                    emitter.send(SseEmitter.event().name("log").data(line));
                }
            }

            int exitCode = process.waitFor();
            if (!cancelled.get()) {
                emitter.send(SseEmitter.event().name("exit").data(exitCode));
                emitter.complete();
            }
        } catch (Exception exception) {
            if (!cancelled.get()) {
                try {
                    emitter.send(SseEmitter.event().name("error").data("2D visualization failed"));
                } catch (IOException ignored) {
                    // The client connection is already closed.
                }
                emitter.complete();
            }
        } finally {
            if (process != null && process.isAlive()) {
                process.destroyForcibly();
            }
        }
    }

    private String normalizeAndValidateFile(String file) {
        if (!StringUtils.hasText(file)) {
            return null;
        }
        Path suppliedPath = Path.of(file);
        if (suppliedPath.isAbsolute() || suppliedPath.getNameCount() != 1
                || !suppliedPath.getFileName().toString().equals(file)
                || !file.toLowerCase().endsWith(".npy")) {
            throw new IllegalArgumentException("file must be a .npy file name");
        }
        return file;
    }

    private String normalizeLang(String lang) {
        if (!StringUtils.hasText(lang)) {
            return "zh";
        }
        return lang.toLowerCase().startsWith("en") ? "en" : "zh";
    }
}
