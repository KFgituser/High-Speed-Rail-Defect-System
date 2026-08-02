package com.bjtu.raillinebackend.controller;



import com.bjtu.raillinebackend.dto.Run3DRecord;
import com.bjtu.raillinebackend.dto.Run3DRequest;
import com.bjtu.raillinebackend.service.Run3DService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/viz3d")
@RequiredArgsConstructor
public class Viz3DController {

    private final Run3DService svc;

    /** 2D 页面发起：启动 3D 生成并立刻返回 runUuid */
    @PostMapping("/run")
    public Map<String, Object> run(@RequestBody Run3DRequest req) {
        Run3DRecord rec = svc.start3D(req);
        return Map.of(
                "runUuid", rec.getRunUuid().toString(),
                "status", rec.getStatus()
        );
    }

    /** 3D 页面查询：按前端需要返回四个卡片项的数组（就绪后给出 imageUrl） */
    @GetMapping("/status/{uuid}")
    public List<Map<String, Object>> status(@PathVariable String uuid) {
        Run3DRecord rec = svc.get(UUID.fromString(uuid));
        if (rec == null) return List.of();

        // 统一标题
        String[] titles = {"3D图1", "3D图2", "3D图3", "3D图4"};
        List<String> imgs = rec.getImageUrls() != null ? rec.getImageUrls() : List.of("", "", "", "");
        List<Map<String, Object>> items = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            items.add(Map.of(
                    "title", titles[i],
                    "imageUrl", i < imgs.size() ? imgs.get(i) : "",
                    "date", rec.getDisplayTime(),
                    "location", rec.getDisplayLocation(),
                    "status", rec.getStatus()
            ));
        }
        return items;
    }
}
