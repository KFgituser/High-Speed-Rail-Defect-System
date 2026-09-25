package com.bjtu.raillinebackend.dto;

import jakarta.validation.constraints.Size;

public record Viz2DSlotUpdateRequest(
        @Size(max = 64, message = "runId must not exceed 64 characters") String runId,
        @Size(max = 512, message = "imagePath must not exceed 512 characters") String imagePath,
        @Size(max = 64, message = "dateStr must not exceed 64 characters") String dateStr,
        @Size(max = 64, message = "startLabel must not exceed 64 characters") String startLabel,
        @Size(max = 64, message = "endLabel must not exceed 64 characters") String endLabel) {
}
