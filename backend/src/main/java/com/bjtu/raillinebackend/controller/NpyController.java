package com.bjtu.raillinebackend.controller;



import com.bjtu.raillinebackend.dto.FileItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class NpyController {

    @Value("${app.data.npyDir}")
    private String npyDir;

    @Value("${app.data.thumbsDir}")
    private String thumbsDir;

    @Value("${app.data.plotsDir}")
    private String plotsDir;

    @Value("${app.python.exe}")
    private String pyExe;

    @Value("${app.python.script}")
    private String pyScript;

    /** GET /api/files —— 列出 D:\JingHu_Data 下所有 .npy */
    @GetMapping("/files")
    public List<FileItem> listNpy() {
        File dir = new File(npyDir);
        if (!dir.exists()) return Collections.emptyList();

        File[] files = dir.listFiles((d, n) -> n.toLowerCase().endsWith(".npy"));
        if (files == null) return Collections.emptyList();

        return Arrays.stream(files)
                .sorted(Comparator.comparingLong(File::lastModified).reversed())
                .map(f -> {
                    FileItem it = new FileItem();
                    it.setName(f.getName());
                    it.setSize(f.length());
                    it.setLastModified(f.lastModified());
                    String png = f.getName().replace(".npy", ".png");
                    it.setThumbUrl("/thumbs/" + png); // 若没有就前端显示占位
                    return it;
                }).collect(Collectors.toList());
    }

    /** POST /api/analyze?filename=xxx.npy —— 调用脚本生成结果图，返回图片 URL */
    @PostMapping("/analyze")
    public Map<String,Object> analyze(@RequestParam String filename) throws Exception {
        File in = new File(npyDir, filename);
        if (!in.exists()) throw new RuntimeException("not found: " + filename);

        Files.createDirectories(new File(plotsDir).toPath());

        String outName = filename.replace(".npy", "_" + Instant.now().toEpochMilli() + ".png");
        File out = new File(plotsDir, outName);

        ProcessBuilder pb = new ProcessBuilder(
                pyExe, pyScript,
                "--input", in.getAbsolutePath(),
                "--out", out.getAbsolutePath()
        );
        pb.redirectErrorStream(true);
        Process p = pb.start();
        int code = p.waitFor();
        if (code != 0) throw new RuntimeException("analyze failed, code=" + code);

        Map<String,Object> resp = new HashMap<>();
        resp.put("imageUrl", "/plots/" + outName);
        return resp;
    }
}
