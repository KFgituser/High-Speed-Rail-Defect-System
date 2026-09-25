package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.dto.DetectionResponse;
import com.bjtu.raillinebackend.dto.DiseaseDetailResponse;
import com.bjtu.raillinebackend.dto.LedgerResponse;
import com.bjtu.raillinebackend.dto.PageResponse;
import com.bjtu.raillinebackend.entity.Severity;
import com.bjtu.raillinebackend.service.RailDataService;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Pattern;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@Validated
public class DiseaseController {
    private final RailDataService railDataService;

    public DiseaseController(RailDataService railDataService) {
        this.railDataService = railDataService;
    }

    @GetMapping("/detections")
    public PageResponse<DetectionResponse> detections(
            @RequestParam(required = false) String line,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @Size(max = 1000) String types,
            @RequestParam(required = false) Severity severity,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) @Size(max = 200) String q,
            @RequestParam(required = false) @Min(0) Integer minMileage,
            @RequestParam(required = false) @Min(0) Integer maxMileage,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "desc") @Pattern(regexp = "(?i)asc|desc") String sortDir) {
        return railDataService.findDetections(line, type, types, severity, start, end, q,
                minMileage, maxMileage, page, size, sortDir);
    }

    @GetMapping("/ledgers")
    public PageResponse<LedgerResponse> ledgers(
            @RequestParam(required = false) String line,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @Size(max = 1000) String types,
            @RequestParam(required = false) Severity severity,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) @Size(max = 200) String q,
            @RequestParam(required = false) @Min(0) Integer minMileage,
            @RequestParam(required = false) @Min(0) Integer maxMileage,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "desc") @Pattern(regexp = "(?i)asc|desc") String sortDir) {
        return railDataService.findLedgers(line, type, types, severity, start, end, q,
                minMileage, maxMileage, page, size, sortDir);
    }

    @GetMapping("/details/{id}")
    public DiseaseDetailResponse detail(@PathVariable String id) {
        return railDataService.findDetail(id);
    }
}
