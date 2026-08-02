package com.bjtu.raillinebackend.controller;
// controller/DiseaseController.java
import com.bjtu.raillinebackend.entity.Severity;
import com.bjtu.raillinebackend.entity.detection;
import com.bjtu.raillinebackend.entity.ledger;
import com.bjtu.raillinebackend.repository.DetectionRepository;
import com.bjtu.raillinebackend.repository.LedgerRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;

@RestController @RequestMapping("/api")
public class DiseaseController {
    private final DetectionRepository detRepo; private final LedgerRepository ledRepo;
    public DiseaseController(DetectionRepository d, LedgerRepository l){ this.detRepo=d; this.ledRepo=l; }

    @GetMapping("/detections")
    public List<detection> detections(
            @RequestParam(required=false) String line,
            @RequestParam(required=false) String type,
            @RequestParam(required=false) Severity severity,
            @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required=false) String q
    ){
        return detRepo.search(line,type,severity,start,end,q);
    }

    @GetMapping("/ledgers")
    public List<ledger> ledgers(
            @RequestParam(required=false) String line,
            @RequestParam(required=false) String type,
            @RequestParam(required=false) Severity severity,
            @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required=false) String q
    ){
        return ledRepo.search(line,type,severity,start,end,q);
    }

    /** 统一详情接口：先查 Detection，再查 Ledger（根据 Dxxx / Txxx） */
    @GetMapping("/details/{id}")
    public Map<String,Object> detail(@PathVariable String id){
        Map<String,Object> map=new LinkedHashMap<>();
        detRepo.findById(id).ifPresent(d -> map.put("detection", d));
        ledRepo.findById(id).ifPresent(l -> map.put("ledger", l));
        if(map.isEmpty()) throw new RuntimeException("Not Found: "+id);
        return map;
    }
}
