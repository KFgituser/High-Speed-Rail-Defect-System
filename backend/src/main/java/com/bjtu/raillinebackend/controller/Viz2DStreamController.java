package com.bjtu.raillinebackend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.Executors;


@RestController
@RequestMapping("/api/viz")
public class Viz2DStreamController {

    @Value("${viz.python}")   private String pythonExe;
    @Value("${viz.script2d}") private String script2d;
    @Value("${viz.workDir}")  private String workDir;
    @Value("${viz.outDir}")   private String outDir;
    @Value("${app.data.npyDir}") private String npyDir;

    /**
     * 继续负责 2D 的 SSE， SSE：启动 2D 任务并实时推送日志/进度。
     * 支持 ?file=xxx.npy（仅处理单个文件）；不带则处理整个目录。
     * 前端示例：
     *   new EventSource(`${API}/viz/run2d/stream?file=${encodeURIComponent(filename)}`)
     */
    @GetMapping(path = "/run2d/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter run2dStream(
            @RequestParam(value = "file", required = false) String file,
            @RequestParam(value = "lang", required = false) String lang
    ) {
        SseEmitter emitter = new SseEmitter(0L); // 不超时

        Executors.newSingleThreadExecutor().submit(() -> {
            Process p = null;
            try {
                // 1) 解析/校验 file 参数
                String singleInput = normalizeAndValidateFile(file);

                // 2) 构建进程
                ProcessBuilder pb = new ProcessBuilder(pythonExe, script2d)
                        .directory(new File(workDir));
                Map<String, String> env = pb.environment();
                env.put("MPLBACKEND", "Agg");
                env.put("VIZ_OUT_DIR", outDir);
                env.put("MPLCONFIGDIR", new File(outDir, ".matplotlib").getAbsolutePath());
                env.put("VIZ_NPY_DIR", npyDir);
                env.put("VIZ_LANG", normalizeLang(lang));
                if (StringUtils.hasText(singleInput)) {
                    env.put("VIZ_INPUT_FILE", singleInput); // 仅跑该文件
                }
                pb.redirectErrorStream(true);

                // 3) 启动并转发 stdout
                p = pb.start();
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = br.readLine()) != null) {
                        emitter.send(line);
                    }
                }

                // 4) 退出码
                int code = p.waitFor();
                // 建议先发 DONE 再发 EXIT，更利于前端判定成功
                // emitter.send("DONE");
                emitter.send("EXIT " + code);
                emitter.complete();

            } catch (Exception e) {
                try { emitter.send("ERROR " + e.getMessage()); } catch (IOException ignore) {}
                emitter.completeWithError(e);
            } finally {
                if (p != null) p.destroyForcibly();
            }
        });

        return emitter;
    }

    /**
     * 仅允许 .npy；允许传文件名（相对根数据目录由 Python拼接）或绝对路径；
     * 拒绝 '..'、奇怪的分隔符注入。为空则返回 null（表示跑整个目录）。
     */
    private String normalizeAndValidateFile(String file) {
        if (!StringUtils.hasText(file)) return null;
        // URL decode（前端一般 encodeURIComponent 过）
        String decoded = URLDecoder.decode(file, StandardCharsets.UTF_8);
        // 基础校验：拒绝路径穿越
        if (decoded.contains("..") || decoded.contains("\0")) {
            throw new IllegalArgumentException("Illegal path segment in file param");
        }
        // 只允许 npy
        String lower = decoded.toLowerCase();
        if (!lower.endsWith(".npy")) {
            throw new IllegalArgumentException("Only .npy files are accepted");
        }
        // 统一分隔符
        decoded = decoded.replace('\\', '/');
        return decoded;
    }

    private String normalizeLang(String lang) {
        if (!StringUtils.hasText(lang)) return "zh";
        return lang.toLowerCase().startsWith("en") ? "en" : "zh";
    }
}


