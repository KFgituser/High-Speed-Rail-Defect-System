package com.bjtu.raillinebackend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Viz3DStartRequest {
    @NotNull(message = "slotId is required")
    @Min(value = 1, message = "slotId must be between 1 and 4")
    @Max(value = 4, message = "slotId must be between 1 and 4")
    private Integer slotId;

    @Size(max = 64, message = "startLabel must not exceed 64 characters")
    private String startLabel;

    @Size(max = 64, message = "endLabel must not exceed 64 characters")
    private String endLabel;

    @Size(max = 32, message = "source must not exceed 32 characters")
    private String source;

    @Pattern(regexp = "(?i)zh|en", message = "lang must be zh or en")
    private String lang;
}
