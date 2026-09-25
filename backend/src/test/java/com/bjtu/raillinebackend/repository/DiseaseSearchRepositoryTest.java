package com.bjtu.raillinebackend.repository;

import com.bjtu.raillinebackend.entity.Detection;
import com.bjtu.raillinebackend.entity.Ledger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@ActiveProfiles("test")
class DiseaseSearchRepositoryTest {
    @Autowired DetectionRepository detections;
    @Autowired LedgerRepository ledgers;

    @BeforeEach
    void seed() {
        saveDetection("D1", "K500+123", "裂纹", 1);
        saveDetection("D2", "K999+999", "破损", 2);
        saveDetection("D3", "K1000+000", "裂纹", 3);
        saveDetection("D4", "K1200+088", "沉降", 4);
        saveDetection("D5", "Kbad+123", "裂纹", 5);
        saveLedger("L1", "K500+123", "裂纹", 1);
        saveLedger("L2", "K999+999", "破损", 2);
        saveLedger("L3", "K1000+000", "裂纹", 3);
        saveLedger("L4", "K1200+088", "沉降", 4);
        saveLedger("L5", "Kbad+123", "裂纹", 5);
    }

    @Test
    void detectionTypesAndMileageAreAppliedBeforePagination() {
        Page<Detection> first = detections.search(null, null, true, List.of("裂纹", "破损"),
                null, null, null, null, 500123, 999999, PageRequest.of(0, 1));
        Page<Detection> second = detections.search(null, null, true, List.of("裂纹", "破损"),
                null, null, null, null, 500123, 999999, PageRequest.of(1, 1));
        assertEquals(2, first.getTotalElements());
        assertEquals(2, first.getTotalPages());
        assertEquals("D1", first.getContent().get(0).getId());
        assertEquals("D2", second.getContent().get(0).getId());
    }

    @Test
    void ledgerMileageUsesNumericComparisonAndTableTypeIntersectsSelection() {
        Page<Ledger> result = ledgers.search(null, "裂纹", true, List.of("裂纹", "破损"),
                null, null, null, null, 1000000, 1200088, PageRequest.of(0, 1));
        assertEquals(1, result.getTotalElements());
        assertEquals("L3", result.getContent().get(0).getId());
    }

    private void saveDetection(String id, String location, String type, int day) {
        Detection item = new Detection();
        item.setId(id);
        item.setLineName("测试线路");
        item.setLocation(location);
        item.setTypeName(type);
        item.setDetectDate(LocalDate.of(2025, 1, day));
        detections.save(item);
    }

    private void saveLedger(String id, String location, String type, int day) {
        Ledger item = new Ledger();
        item.setId(id);
        item.setLineName("测试线路");
        item.setLocation(location);
        item.setTypeName(type);
        item.setRecordDate(LocalDate.of(2025, 1, day));
        ledgers.save(item);
    }
}
