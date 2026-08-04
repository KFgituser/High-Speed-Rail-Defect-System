package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.dto.Viz3DLatestResponse;
import com.bjtu.raillinebackend.dto.Viz3DStartRequest;
import com.bjtu.raillinebackend.dto.Viz3DStartResponse;
import com.bjtu.raillinebackend.service.Viz3DService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/viz")
public class Viz3DController {

    private final Viz3DService service;

    public Viz3DController(Viz3DService service) {
        this.service = service;
    }

    // 1) 启动 3D（立即返回 runUuid）
    @PostMapping("/run3d")
    public Viz3DStartResponse run3d(@RequestBody Viz3DStartRequest req) {
        String runUuid = service.start3D(req);
        return new Viz3DStartResponse(runUuid, req.getSlotId());
    }

    // 2) SSE：监听日志 / DONE / EXIT
    @GetMapping(value = "/run3d/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam("runUuid") String runUuid) {
        return service.openStream(runUuid);
    }

    // 3) latest：给 3D 页面加载对应槽位最新图
    @GetMapping("/run3d/latest")
    public Viz3DLatestResponse latest(@RequestParam("slotId") int slotId) {
        return service.getLatest(slotId);
    }
}
