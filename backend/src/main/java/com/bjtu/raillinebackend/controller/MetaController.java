package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.dto.DiseaseTypeResponse;
import com.bjtu.raillinebackend.dto.RailLineResponse;
import com.bjtu.raillinebackend.service.MetaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MetaController {
    private final MetaService metaService;

    public MetaController(MetaService metaService) {
        this.metaService = metaService;
    }

    @GetMapping("/lines")
    public List<RailLineResponse> lines() {
        return metaService.findLines();
    }

    @GetMapping("/disease-types")
    public List<DiseaseTypeResponse> types() {
        return metaService.findDiseaseTypes();
    }
}
