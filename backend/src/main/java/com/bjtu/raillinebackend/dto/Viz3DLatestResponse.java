package com.bjtu.raillinebackend.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Viz3DLatestResponse {
    private int slotId;
    private String runUuid;
    private String imageUrl;
    private String date;
    private String startLabel;
    private String endLabel;

    public Viz3DLatestResponse() {}

    public Viz3DLatestResponse(int slotId, String runUuid, String imageUrl) {
        this.slotId = slotId;
        this.runUuid = runUuid;
        this.imageUrl = imageUrl;
    }

    public Viz3DLatestResponse(int slotId, String runUuid, String imageUrl, String date) {
        this.slotId = slotId;
        this.runUuid = runUuid;
        this.imageUrl = imageUrl;
        this.date = date;
    }

    public Viz3DLatestResponse(int slotId, String runUuid, String imageUrl, String date, String startLabel, String endLabel) {
        this.slotId = slotId;
        this.runUuid = runUuid;
        this.imageUrl = imageUrl;
        this.date = date;
        this.startLabel = startLabel;
        this.endLabel = endLabel;
    }

    public static Viz3DLatestResponse empty(int slotId) {
        return new Viz3DLatestResponse(slotId, null, null, null);
    }

}
