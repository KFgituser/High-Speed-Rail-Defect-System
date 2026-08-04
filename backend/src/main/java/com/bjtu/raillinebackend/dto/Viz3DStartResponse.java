package com.bjtu.raillinebackend.dto;


import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Viz3DStartResponse {
    private String runUuid;
    private Integer slotId;

    public Viz3DStartResponse() {}
    public Viz3DStartResponse(String runUuid, Integer slotId) {
        this.runUuid = runUuid;
        this.slotId = slotId;
    }

}
