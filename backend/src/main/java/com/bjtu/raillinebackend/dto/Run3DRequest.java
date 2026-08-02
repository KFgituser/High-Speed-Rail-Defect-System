package com.bjtu.raillinebackend.dto;

import lombok.Data;

@Data
public class Run3DRequest {
    private String line;

    // 页面展示所需的时间与里程文本（直接从 2D 页面传来即可）
    private String startLabel;
    private String endLabel;
    private String startYear;
    private String endYear;
    private String selectedMonth;
    private String selectedDay;
}
