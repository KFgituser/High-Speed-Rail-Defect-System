package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.entity.Viz2DSlot;
import com.bjtu.raillinebackend.service.VizSlotService;
import io.jsonwebtoken.io.IOException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/slots")
public class Viz2DSlotController {
    private final VizSlotService service;

    public Viz2DSlotController(VizSlotService service) {
        this.service = service;
    }

    @GetMapping
    public List<Viz2DSlot> getSlots() {
        return service.getAll();
    }

    @PostMapping("/{slotId}")
    public Viz2DSlot updateSlot(@PathVariable Integer slotId, @RequestBody Viz2DSlot slot) {
        slot.setSlotId(slotId);
        return service.updateSlot(slotId,slot);
    }

    @DeleteMapping("/{slotId}")
    public void clearSlot(@PathVariable Integer slotId) {
        service.clearSlot(slotId);
    }

    /** 把当前 viz2d 结果快照到指定槽位，并返回该槽位最新数据 */
    @PostMapping("/{slotId}/snapshot")
    public ResponseEntity<Viz2DSlot> snapshot(@PathVariable int slotId) throws IOException, java.io.IOException {
        return ResponseEntity.ok(service.snapshotCurrent2dToSlot(slotId));
    }

}
