package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.dto.Viz2DSlotResponse;
import com.bjtu.raillinebackend.dto.Viz2DSlotUpdateRequest;
import com.bjtu.raillinebackend.service.VizSlotService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/slots")
@Validated
public class Viz2DSlotController {
    private final VizSlotService service;

    public Viz2DSlotController(VizSlotService service) {
        this.service = service;
    }

    @GetMapping
    public List<Viz2DSlotResponse> getSlots() {
        return service.getAll();
    }

    @PutMapping("/{slotId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR')")
    public Viz2DSlotResponse updateSlot(@PathVariable @Min(1) @Max(4) Integer slotId,
                                        @Valid @RequestBody Viz2DSlotUpdateRequest request) {
        return service.updateSlot(slotId, request);
    }

    @DeleteMapping("/{slotId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> clearSlot(@PathVariable @Min(1) @Max(4) Integer slotId) {
        service.clearSlot(slotId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{slotId}/snapshot")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTOR')")
    public ResponseEntity<Viz2DSlotResponse> snapshot(@PathVariable @Min(1) @Max(4) int slotId) throws IOException {
        return ResponseEntity.ok(service.snapshotCurrent2dToSlot(slotId));
    }
}
