package com.bjtu.raillinebackend.dto;

import com.bjtu.raillinebackend.entity.Severity;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
public class ExportFilter {
    @Size(max = 200)
    private String line;
    @Size(max = 1000)
    private String types;
    @Min(0)
    private Integer minMileage;
    @Min(0)
    private Integer maxMileage;
    @Size(max = 200)
    private String detectionType;
    private Severity detectionSeverity;
    @Size(max = 200)
    private String ledgerType;
    private Severity ledgerSeverity;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate start;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate end;
    @Size(max = 200)
    private String q;
}
