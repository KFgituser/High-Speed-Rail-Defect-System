package com.bjtu.raillinebackend.viz;


import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.List;

public class Viz3DRunContext {
    public final String runUuid;
    public final int slotId;

    public volatile SseEmitter emitter;
    public final List<String> buffer = new ArrayList<>();
    public volatile boolean finished = false;

    public Viz3DRunContext(String runUuid, int slotId) {
        this.runUuid = runUuid;
        this.slotId = slotId;
    }
}
