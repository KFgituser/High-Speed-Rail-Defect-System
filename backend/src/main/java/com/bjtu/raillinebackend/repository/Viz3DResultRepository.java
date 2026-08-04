package com.bjtu.raillinebackend.repository;


import com.bjtu.raillinebackend.entity.Viz3DResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface Viz3DResultRepository extends JpaRepository<Viz3DResult, Long> {
    Optional<Viz3DResult> findTopBySlotIdOrderByCreatedAtDesc(Integer slotId);
}
