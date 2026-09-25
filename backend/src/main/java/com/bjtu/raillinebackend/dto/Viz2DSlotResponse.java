package com.bjtu.raillinebackend.dto;

import java.sql.Timestamp;

public record Viz2DSlotResponse(
        Integer slotId, String runId, String imagePath, String dateStr,
        String startLabel, String endLabel, Timestamp updatedAt) {
}
