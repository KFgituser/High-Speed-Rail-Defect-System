package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.dto.Viz3DLatestResponse;
import com.bjtu.raillinebackend.dto.Viz3DJobStatusResponse;
import com.bjtu.raillinebackend.dto.Viz3DStartRequest;
import com.bjtu.raillinebackend.dto.Viz3DStartResponse;
import com.bjtu.raillinebackend.service.Viz3DService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/viz")
@Validated
public class Viz3DController {

    private final Viz3DService service;

    public Viz3DController(Viz3DService service) {
        this.service = service;
    }

    // 1) 启动 3D（立即返回 runUuid）
    @PostMapping("/run3d")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR')")
    public ResponseEntity<Viz3DStartResponse> run3d(@Valid @RequestBody Viz3DStartRequest req) {
        String runUuid = service.start3D(req);
        return ResponseEntity.accepted().body(new Viz3DStartResponse(runUuid, req.getSlotId()));
    }

    // 2) SSE：监听日志 / DONE / EXIT
    @GetMapping(value = "/run3d/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR')")
    public SseEmitter stream(@RequestParam("runUuid") @NotBlank @Size(max = 64) String runUuid) {
        return service.openStream(runUuid);
    }

    @GetMapping("/run3d/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR')")
    public Viz3DJobStatusResponse status(@RequestParam("runUuid") @NotBlank @Size(max = 64) String runUuid) {
        return service.getStatus(runUuid);
    }

    // 3) latest：给 3D 页面加载对应槽位最新图
    @GetMapping("/run3d/latest")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR', 'MANAGER')")
    public Viz3DLatestResponse latest(@RequestParam("slotId") @Min(1) @Max(4) int slotId) {
        return service.getLatest(slotId);
    }
}
