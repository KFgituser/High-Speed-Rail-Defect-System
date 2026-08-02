package com.bjtu.raillinebackend.repository;

import com.bjtu.raillinebackend.entity.Viz2DSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VizSlotRepository extends JpaRepository<Viz2DSlot, Integer> {
    List<Viz2DSlot> findAllByOrderBySlotIdAsc();
    Optional<Viz2DSlot> findBySlotId(Integer slotId);
}

