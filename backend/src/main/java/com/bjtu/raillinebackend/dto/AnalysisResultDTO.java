package com.bjtu.raillinebackend.dto;

import lombok.Data;

import java.util.Map;

// dto/AnalysisResultDTO.java
@Data
public class AnalysisResultDTO {
    private Integer slotId;                         // 1~4
    private Map<String, Integer> metrics;           // {"total":8,"破损":0,"裂纹":0,"冒浆":8}
    private String analyzedAt;                      // ISO字符串或 "yyyy-MM-dd HH:mm:ss"
    private String runId;
}
