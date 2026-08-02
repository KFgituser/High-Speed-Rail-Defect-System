package com.bjtu.raillinebackend.service;


import com.bjtu.raillinebackend.dto.Run3DRecord;
import com.bjtu.raillinebackend.dto.Run3DRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
public class Run3DService {

    @Value("${viz.python}")   private String pythonExe;      // C:/Python313/python.exe
    @Value("${viz.script3d}") private String script3d;       // D:/.../front_side_3D frontend.py
    @Value("${viz.outDir}")   private String outRoot;        // D:/.../output

    private final Map<UUID, Run3DRecord> store = new ConcurrentHashMap<>();
    private final ExecutorService pool = Executors.newCachedThreadPool();

    public Run3DRecord start3D(Run3DRequest req) {
        UUID uuid = UUID.randomUUID();
        Path runDir = Path.of(outRoot, uuid.toString());
        try { Files.createDirectories(runDir); } catch (IOException ignored) {}

        String timeText = String.format("%s年 %s月 %s日",
                nvl(req.getStartYear()), nvl(req.getSelectedMonth()), nvl(req.getSelectedDay()));
        String locText = String.format("%s - %s", nvl(req.getStartLabel()), nvl(req.getEndLabel()));

        Run3DRecord rec = Run3DRecord.builder()
                .runUuid(uuid)
                .status("PENDING")
                .runDir(runDir)
                .displayTime(timeText)
                .displayLocation(locText)
                .createdAt(Instant.now())
                .build();
        store.put(uuid, rec);

        // 异步启动脚本
        rec.setStatus("RUNNING");
        pool.submit(() -> runProcess(uuid, runDir, rec));
        return rec;
    }

    public Run3DRecord get(UUID id) { return store.get(id); }

    /** 实际启动 3D 脚本并在成功后准备 4 张图 */
    private void runProcess(UUID uuid, Path runDir, Run3DRecord rec) {
        List<String> cmd = new ArrayList<>();
        cmd.add(pythonExe);
        cmd.add(script3d);

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(runDir.toFile());
        Map<String, String> env = pb.environment();
        env.put("VIZ_OUT_DIR", runDir.toString()); // 脚本会把 image3D.png 写到这里
        env.put("RUN_UUID", uuid.toString());
        env.put("PYTHONIOENCODING", "utf-8");

        try {
            Process p = pb.start();
            Future<?> f1 = pool.submit(() -> pipe(p.getInputStream(), s -> System.out.println("[3D OUT] "+s)));
            Future<?> f2 = pool.submit(() -> pipe(p.getErrorStream(), s -> System.err.println("[3D ERR] "+s)));

            int code = p.waitFor();
            f1.get(); f2.get();

            if (code != 0) {
                rec.setStatus("FAILED");
                rec.setMessage("3D script exit code = " + code);
            } else {
                // 原脚本输出的是 image3D.png。这里最小改动：复制成 4 份。
                Path src = runDir.resolve("image3D.png");
                if (!Files.exists(src)) {
                    rec.setStatus("FAILED");
                    rec.setMessage("image3D.png not found");
                } else {
                    for (int i = 1; i <= 4; i++) {
                        Files.copy(src, runDir.resolve("image3D_" + i + ".png"),
                                StandardCopyOption.REPLACE_EXISTING);
                    }
                    // 组装 4 个 URL（/viz-out/** 会在 WebStaticConfig 里映射）
                    List<String> urls = new ArrayList<>();
                    for (int i = 1; i <= 4; i++) {
                        urls.add("/viz-out/" + uuid + "/image3D_" + i + ".png");
                    }
                    rec.setImageUrls(urls);
                    rec.setStatus("SUCCEEDED");
                }
            }
        } catch (Exception e) {
            rec.setStatus("FAILED");
            rec.setMessage("Runner error: " + e.getMessage());
        } finally {
            rec.setFinishedAt(Instant.now());
        }
    }

    private void pipe(InputStream is, java.util.function.Consumer<String> sink) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line; while ((line = br.readLine()) != null) sink.accept(line);
        } catch (IOException ignored) {}
    }

    private static String nvl(String s) { return (s == null) ? "" : s; }
}
