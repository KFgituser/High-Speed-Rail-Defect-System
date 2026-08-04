package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.dto.AnalysisResultDTO;
import com.bjtu.raillinebackend.service.AnalysisResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/*
* 是 Web 层入口（Controller），专门对外提供“分析结果 AnalysisResult”的 HTTP API。
* 本身不写业务逻辑，只负责：
   接收前端请求（JSON / 参数）
   调用 AnalysisResultService
   把 service 的结果包装成 HTTP 响应返回
* */


// controller/AnalysisResultController.java
@RestController     //等价于 @Controller + @ResponseBody
@RequestMapping("/api/analysis-results")
@RequiredArgsConstructor
public class AnalysisResultController {
    private final AnalysisResultService service;

    // 调用 service.save(dto)：把分析结果保存到数据库（或文件/缓存，取决于service 实现）
    @PostMapping
    public ResponseEntity<?> save(@RequestBody AnalysisResultDTO dto) {
        service.save(dto);
        // 返回 状态行200 OK、无响应头 .build()：把这个响应“构建完成”
        //ResponseEntity.ok()：创建一个 HTTP 状态码为 200 OK 的响应
        return ResponseEntity.ok().build(); //.build()：把这个响应“构建完成”，但不放任何响应体（body）
    }
    // 获取某个 slot 的最新结果
    @GetMapping("/latest")
    public ResponseEntity<?> latest(@RequestParam Integer slotId) { //@RequestParam Integer slotId：从 URL query 里取 slotId
        return service.latest(slotId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of())); // 没有就返回 {}
    }
}
