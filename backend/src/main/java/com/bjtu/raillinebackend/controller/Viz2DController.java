package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.viz.PythonRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

/*
* 槽位快照入库
* */


@RestController
@RequestMapping("/api/viz")
public class Viz2DController {

    @Value("${viz.python}")   private String pythonExe;
    @Value("${viz.script2d}") private String script2d;

    @Value("${viz.outDir}")   private String outDir;
    @Value("${viz.workDir}")  private String workDir;

    private final PythonRunner runner;
    public Viz2DController(PythonRunner runner) { this.runner = runner; }

    @PostMapping("/run2d")
    public ResponseEntity<?> run2d() {
        try {
            Map<String,String> env = new HashMap<>();
            env.put("MPLBACKEND", "Agg");
            env.put("VIZ_OUT_DIR", outDir);

            PythonRunner.Result r = runner.run(
                    pythonExe, script2d, new File(workDir), env, null, 100 * 60_000L);

            if (r.exitCode != 0)
                return ResponseEntity.status(500).body("2D 生成失败\n" + r.log);

            File f = new File(outDir, "viz2d.png");
            if (!f.exists()) return ResponseEntity.status(500).body("未找到 viz2d.png");
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(new FileSystemResource(f));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("2D 异常: " + e.getMessage());
        }
    }

    
}
