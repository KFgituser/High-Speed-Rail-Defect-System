package com.bjtu.raillinebackend.dto;


import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Viz3DStartRequest {
    private Integer slotId;      // 1..4
    private String startLabel;   // Kxxx+yyy
    private String endLabel;     // Kxxx+yyy
    private String source;       // "viz-out"（预留）
    private String lang;         // "zh" / "en"

}
