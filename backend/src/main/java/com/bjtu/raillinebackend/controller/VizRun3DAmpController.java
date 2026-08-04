package com.bjtu.raillinebackend.controller;


import com.bjtu.raillinebackend.dto.LatestVizResponse;
import com.bjtu.raillinebackend.dto.RunStartResponse;
import com.bjtu.raillinebackend.service.VizRun3DAmpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/viz/run3damp")
public class VizRun3DAmpController {

    private final VizRun3DAmpService service;

    public VizRun3DAmpController(VizRun3DAmpService service) {
        this.service = service;
    }

    @PostMapping("/start")
    public ResponseEntity<?> start(@RequestParam int slotId,
                                   @RequestParam(value = "lang", required = false) String lang) {
        try {
            String uuid = service.start(slotId, lang);
            return ResponseEntity.ok(new RunStartResponse(uuid, slotId));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/stream")
    public SseEmitter stream(@RequestParam String runUuid) {
        return service.stream(runUuid);
    }

    @GetMapping("/latest")
    public LatestVizResponse latest(@RequestParam int slotId) {
        return service.latest(slotId);
    }
}
