package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.dto.AnalysisResultDTO;
import com.bjtu.raillinebackend.service.AnalysisResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// controller/AnalysisResultController.java
@RestController
@RequestMapping("/api/analysis-results")
@RequiredArgsConstructor
public class AnalysisResultController {
    private final AnalysisResultService service;

    @PostMapping
    public ResponseEntity<?> save(@RequestBody AnalysisResultDTO dto) {
        service.save(dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/latest")
    public ResponseEntity<?> latest(@RequestParam Integer slotId) {
        return service.latest(slotId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of())); // 没有就返回 {}
    }
}
