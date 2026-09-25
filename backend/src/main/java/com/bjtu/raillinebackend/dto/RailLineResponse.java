package com.bjtu.raillinebackend.dto;

public record RailLineResponse(Long id, String code, String name, Integer kmMin, Integer kmMax) {
}
