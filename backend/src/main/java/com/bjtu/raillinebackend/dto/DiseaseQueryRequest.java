package com.bjtu.raillinebackend.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class DiseaseQueryRequest {
    // 条件
    private String lineName;              // 线路名
    private List<String> types;           // 病害类型列表
    private List<String> severities;      // 严重程度列表
    private LocalDate dateFrom;           // 发现时间起
    private LocalDate dateTo;             // 发现时间止
    private String keyword;               // 关键字(描述/位置/记录人 模糊查)

    // 分页
    private Integer page = 0;             // 从 0 开始
    private Integer size = 20;            // 默认 20 / 页

    // 排序
    private String sortBy = "detectedAt"; // 默认按时间
    private String sortDir = "DESC";      // ASC / DESC
}
