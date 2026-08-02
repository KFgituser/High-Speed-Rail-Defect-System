package com.bjtu.raillinebackend.repository;


import com.bjtu.raillinebackend.entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnalysisResultRepo extends JpaRepository<AnalysisResult, Long> {
    Optional<AnalysisResult> findTopBySlotIdOrderByAnalyzedAtDesc(Integer slotId);
}