package com.bjtu.raillinebackend.dto;

import java.time.LocalDate;
import com.bjtu.raillinebackend.entity.Severity;

public record DetectionResponse(
        String id, String lineName, String location, String typeName, LocalDate detectDate,
        Severity severity, String description, String inspector, String suggestion, String history) {
}
