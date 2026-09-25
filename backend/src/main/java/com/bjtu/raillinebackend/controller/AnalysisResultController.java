package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.dto.AnalysisResultDTO;
import com.bjtu.raillinebackend.exception.ResourceNotFoundException;
import com.bjtu.raillinebackend.service.AnalysisResultService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.security.access.prepost.PreAuthorize;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analysis-results")
@RequiredArgsConstructor
@Validated
public class AnalysisResultController {
    private final AnalysisResultService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR')")
    public ResponseEntity<Void> save(@Valid @RequestBody AnalysisResultDTO dto) {
        service.save(dto);
        return ResponseEntity.status(201).build();
    }

    @GetMapping("/latest")
    public ResponseEntity<AnalysisResultDTO> latest(@RequestParam @Min(1) @Max(4) Integer slotId) {
        return service.latest(slotId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis result for slot", slotId));
    }
}
