package com.bjtu.raillinebackend.dto;

import java.time.LocalDate;
import com.bjtu.raillinebackend.entity.Severity;

public record LedgerResponse(
        String id, String lineName, String location, String typeName, LocalDate recordDate,
        Severity severity, String description, String recorder, String suggestion, String history) {
}
