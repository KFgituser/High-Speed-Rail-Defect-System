package com.bjtu.raillinebackend.dto;


public class RunStartResponse {
    private String runUuid;
    private int slotId;

    public RunStartResponse() {}
    public RunStartResponse(String runUuid, int slotId) {
        this.runUuid = runUuid;
        this.slotId = slotId;
    }
    public String getRunUuid() { return runUuid; }
    public void setRunUuid(String runUuid) { this.runUuid = runUuid; }
    public int getSlotId() { return slotId; }
    public void setSlotId(int slotId) { this.slotId = slotId; }
}
