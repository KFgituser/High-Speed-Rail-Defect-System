package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.dto.AnalysisImageResponse;
import com.bjtu.raillinebackend.dto.FileItem;
import com.bjtu.raillinebackend.service.NpyAnalysisService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api")
public class NpyController {
    private final NpyAnalysisService npyAnalysisService;

    public NpyController(NpyAnalysisService npyAnalysisService) {
        this.npyAnalysisService = npyAnalysisService;
    }

    @GetMapping("/files")
    public List<FileItem> listNpy() {
        return npyAnalysisService.listNpyFiles();
    }

    @PostMapping("/analyze")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR')")
    public AnalysisImageResponse analyze(
            @RequestParam @NotBlank(message = "filename is required")
            @Size(max = 255, message = "filename must not exceed 255 characters") String filename) {
        return npyAnalysisService.analyze(filename);
    }
}
