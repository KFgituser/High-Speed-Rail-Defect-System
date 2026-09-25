package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.viz.PythonRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.constraints.Size;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/viz")
@Validated
public class Viz2DController {
    @Value("${viz.python}")
    private String pythonExe;

    @Value("${viz.script2d}")
    private String script2d;

    @Value("${viz.outDir}")
    private String outDir;

    @Value("${viz.workDir}")
    private String workDir;

    @Value("${app.data.npyDir}")
    private String npyDir;

    private final PythonRunner runner;

    public Viz2DController(PythonRunner runner) {
        this.runner = runner;
    }

    @PostMapping("/run2d")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR')")
    public ResponseEntity<FileSystemResource> run2d(@RequestParam(value = "lang", required = false) @Size(max = 8) String lang) {
        try {
            Map<String, String> env = new HashMap<>();
            env.put("MPLBACKEND", "Agg");
            env.put("VIZ_OUT_DIR", outDir);
            env.put("MPLCONFIGDIR", new File(outDir, ".matplotlib").getAbsolutePath());
            env.put("VIZ_NPY_DIR", npyDir);
            env.put("VIZ_LANG", normalizeLang(lang));

            PythonRunner.Result result = runner.run(
                    pythonExe, script2d, new File(workDir), env, null, 100 * 60_000L);
            if (result.exitCode != 0) {
                throw new RuntimeException("2D visualization generation failed");
            }

            File image = new File(outDir, "viz2d.png");
            if (!image.exists()) {
                throw new RuntimeException("2D visualization output was not created");
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(new FileSystemResource(image));
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new RuntimeException("2D visualization failed", exception);
        }
    }

    private String normalizeLang(String lang) {
        if (lang == null) {
            return "zh";
        }
        return lang.toLowerCase().startsWith("en") ? "en" : "zh";
    }
}
