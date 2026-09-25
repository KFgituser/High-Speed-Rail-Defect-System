package com.bjtu.raillinebackend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiErrorResponse(int code, String msg, Map<String, String> errors) {
    public ApiErrorResponse(int code, String msg) {
        this(code, msg, Map.of());
    }
}
