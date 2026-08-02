package com.bjtu.raillinebackend.controller;

// controller/MetaController.java
import com.bjtu.raillinebackend.entity.diseaseType;
import com.bjtu.raillinebackend.entity.rail_line;
import com.bjtu.raillinebackend.repository.DiseaseTypeRepository;
import com.bjtu.raillinebackend.repository.RailLineRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api")
public class MetaController {
    private final RailLineRepository lineRepo;
    private final DiseaseTypeRepository typeRepo;

    public MetaController(RailLineRepository l, DiseaseTypeRepository t){
        this.lineRepo=l;
        this.typeRepo=t;
    }

    @GetMapping("/lines") public List<rail_line> lines(){ return lineRepo.findAll(); }
    @GetMapping("/disease-types") public List<diseaseType> types(){ return typeRepo.findAll(); }
}
