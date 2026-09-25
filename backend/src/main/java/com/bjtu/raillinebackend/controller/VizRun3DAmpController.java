package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.dto.LatestVizResponse;
import com.bjtu.raillinebackend.dto.RunStartResponse;
import com.bjtu.raillinebackend.dto.Viz3DJobStatusResponse;
import com.bjtu.raillinebackend.service.VizRun3DAmpService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/viz/run3damp")
@Validated
public class VizRun3DAmpController {
    private final VizRun3DAmpService service;

    public VizRun3DAmpController(VizRun3DAmpService service) {
        this.service = service;
    }

    @PostMapping("/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR')")
    public ResponseEntity<RunStartResponse> start(@RequestParam @Min(1) @Max(4) int slotId,
                                                  @RequestParam(value = "lang", required = false) @Size(max = 8) String lang) {
        String uuid = service.start(slotId, lang);
        return ResponseEntity.accepted().body(new RunStartResponse(uuid, slotId));
    }

    @GetMapping("/stream")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR')")
    public SseEmitter stream(@RequestParam @NotBlank @Size(max = 64) String runUuid) {
        return service.stream(runUuid);
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR')")
    public Viz3DJobStatusResponse status(@RequestParam @NotBlank @Size(max = 64) String runUuid) {
        return service.status(runUuid);
    }

    @GetMapping("/latest")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR', 'MANAGER')")
    public LatestVizResponse latest(@RequestParam @Min(1) @Max(4) int slotId) {
        return service.latest(slotId);
    }
}
