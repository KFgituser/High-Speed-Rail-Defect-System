package com.bjtu.raillinebackend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Map;

@Data
public class AnalysisResultDTO {
    @NotNull(message = "slotId is required")
    @Min(value = 1, message = "slotId must be between 1 and 4")
    @Max(value = 4, message = "slotId must be between 1 and 4")
    private Integer slotId;

    @NotEmpty(message = "metrics must not be empty")
    private Map<@Size(max = 50, message = "metric name must not exceed 50 characters") String,
            @NotNull(message = "metric value is required") @PositiveOrZero(message = "metric value must not be negative") Integer> metrics;

    private String analyzedAt;
    private String runId;
}
