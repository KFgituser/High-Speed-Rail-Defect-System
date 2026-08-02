package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.dto.AnalysisResultDTO;
import com.bjtu.raillinebackend.entity.AnalysisResult;
import com.bjtu.raillinebackend.repository.AnalysisResultRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

// service/AnalysisResultService.java
@Service
@RequiredArgsConstructor
public class AnalysisResultService {
    private final AnalysisResultRepo repo;
    private final ObjectMapper mapper = new ObjectMapper();

    public AnalysisResult save(AnalysisResultDTO dto) {
        AnalysisResult e = new AnalysisResult();
        e.setSlotId(dto.getSlotId());
        try { e.setMetricsJson(mapper.writeValueAsString(dto.getMetrics())); }
        catch (Exception ex) { throw new RuntimeException("metrics 序列化失败", ex); }

        // 允许前端传，也可后端直接 LocalDateTime.now()
        e.setAnalyzedAt(dto.getAnalyzedAt() != null
                ? LocalDateTime.parse(dto.getAnalyzedAt().replace(" ", "T"))
                : LocalDateTime.now());
        e.setRunId(dto.getRunId());
        return repo.save(e);
    }

    public Optional<AnalysisResultDTO> latest(Integer slotId) {
        return repo.findTopBySlotIdOrderByAnalyzedAtDesc(slotId).map(e -> {
            AnalysisResultDTO dto = new AnalysisResultDTO();
            dto.setSlotId(e.getSlotId());
            try {
                dto.setMetrics(mapper.readValue(e.getMetricsJson(), new TypeReference<Map<String,Integer>>(){}));
            } catch (Exception ex) { dto.setMetrics(Collections.emptyMap()); }
            dto.setAnalyzedAt(e.getAnalyzedAt().toString());
            dto.setRunId(e.getRunId());
            return dto;
        });
    }
}
