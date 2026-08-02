package com.bjtu.raillinebackend.entity;

import jakarta.persistence.*;
import lombok.Data;



import java.time.LocalDateTime;


// entity/AnalysisResult.java
@Entity
@Table(name="analysis_result")
@Data
public class AnalysisResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Integer slotId;

    @Column(columnDefinition = "json")  // 若用TEXT就去掉 columnDefinition
    private String metricsJson;

    private LocalDateTime analyzedAt;
    private String runId;
}

