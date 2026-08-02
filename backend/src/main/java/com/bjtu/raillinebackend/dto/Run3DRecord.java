package com.bjtu.raillinebackend.dto;

import lombok.Builder;
import lombok.Data;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data @Builder
public class Run3DRecord {
    private UUID runUuid;
    private String status;             // PENDING / RUNNING / SUCCEEDED / FAILED
    private String message;

    private Path runDir;               // {viz.outDir}/{uuid}
    private List<String> imageUrls;    // 4 张图的 http 路径：/viz-out/{uuid}/image3D_1.png ...
    private String displayTime;        // "2025年 09月 03日" 这样的字符串
    private String displayLocation;    // "K1140+000 - K1152+864"

    private Instant createdAt;
    private Instant finishedAt;
}