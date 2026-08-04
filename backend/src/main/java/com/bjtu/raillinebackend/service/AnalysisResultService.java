package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.dto.AnalysisResultDTO;
import com.bjtu.raillinebackend.entity.AnalysisResult;
import com.bjtu.raillinebackend.repository.AnalysisResultRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

// service/AnalysisResultService.java
@Service
@RequiredArgsConstructor
public class AnalysisResultService {
    private final AnalysisResultRepo repo;
    private final ObjectMapper mapper = new ObjectMapper();
    // 系统按中国时间，用 Asia/Shanghai；否则用 systemDefault()
    private static final ZoneId STORE_ZONE = ZoneId.of("Asia/Shanghai");
    public AnalysisResult save(AnalysisResultDTO dto) {
        AnalysisResult e = new AnalysisResult();
        e.setSlotId(dto.getSlotId());

        try { e.setMetricsJson(mapper.writeValueAsString(dto.getMetrics())); }
        catch (Exception ex) { throw new RuntimeException("metrics 序列化失败", ex); }

        e.setAnalyzedAt(dto.getAnalyzedAt() != null
                ? parseToLocalDateTime(dto.getAnalyzedAt())
                : LocalDateTime.now(STORE_ZONE));

        e.setRunId(dto.getRunId());
        return repo.save(e);
    }

    private static LocalDateTime parseToLocalDateTime(String raw) {
        String s = raw.trim().replace(" ", "T");

        try {
            // 能吃：2026-01-08T05:54:23.547Z / 2026-01-08T05:54:23+08:00 等
            OffsetDateTime odt = OffsetDateTime.parse(s, DateTimeFormatter.ISO_DATE_TIME);
            return odt.atZoneSameInstant(STORE_ZONE).toLocalDateTime();
        } catch (DateTimeParseException ignore) {
            // 兜底：能吃 2026-01-08T13:54:23 或 2026-01-08 13:54:23
            return LocalDateTime.parse(s, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }
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
