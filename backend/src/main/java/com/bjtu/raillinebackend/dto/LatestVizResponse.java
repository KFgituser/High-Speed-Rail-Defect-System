package com.bjtu.raillinebackend.dto;


public class LatestVizResponse {
    private String imageUrl; // 形如 /viz-out/amp/slot1/image3D_amp.png
    private String date;
    private String startLabel;
    private String endLabel;

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getStartLabel() { return startLabel; }
    public void setStartLabel(String startLabel) { this.startLabel = startLabel; }
    public String getEndLabel() { return endLabel; }
    public void setEndLabel(String endLabel) { this.endLabel = endLabel; }
}
