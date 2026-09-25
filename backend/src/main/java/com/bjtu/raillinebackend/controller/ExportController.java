package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.dto.DiseaseDetailResponse;
import com.bjtu.raillinebackend.dto.ExportFilter;
import com.bjtu.raillinebackend.service.ExportService;
import com.bjtu.raillinebackend.service.RailDataService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.nio.charset.StandardCharsets;

@RestController
public class ExportController {
    private static final MediaType EXCEL_MEDIA_TYPE = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final ExportService exportService;
    private final RailDataService railDataService;

    public ExportController(ExportService exportService, RailDataService railDataService) {
        this.exportService = exportService;
        this.railDataService = railDataService;
    }

    @GetMapping("/api/export-detection")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR', 'MANAGER')")
    public ResponseEntity<StreamingResponseBody> exportDetection(@Valid @ModelAttribute ExportFilter filter) {
        return excelFile("自有检测数据.xlsx", output -> exportService.writeDetections(output, filter));
    }

    @GetMapping("/api/export-ledger")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR', 'MANAGER')")
    public ResponseEntity<StreamingResponseBody> exportLedger(@Valid @ModelAttribute ExportFilter filter) {
        return excelFile("高铁台账数据.xlsx", output -> exportService.writeLedgers(output, filter));
    }

    @GetMapping("/api/export-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR', 'MANAGER')")
    public ResponseEntity<StreamingResponseBody> exportAll(@Valid @ModelAttribute ExportFilter filter) {
        return excelFile("检测与台账.xlsx", output -> exportService.writeAll(output, filter));
    }

    @GetMapping("/api/export-detail/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR', 'MANAGER')")
    public ResponseEntity<StreamingResponseBody> exportDetail(@PathVariable String id) {
        DiseaseDetailResponse detail = railDataService.findDetail(id);
        return excelFile("病害详情-" + id.replaceAll("[^\\p{L}\\p{N}_-]", "_") + ".xlsx",
                output -> exportService.writeDetail(output, detail));
    }

    private ResponseEntity<StreamingResponseBody> excelFile(String filename, StreamingResponseBody body) {
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(EXCEL_MEDIA_TYPE)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(body);
    }
}
