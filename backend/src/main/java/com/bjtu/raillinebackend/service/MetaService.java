package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.dto.DiseaseTypeResponse;
import com.bjtu.raillinebackend.dto.RailLineResponse;
import com.bjtu.raillinebackend.repository.DiseaseTypeRepository;
import com.bjtu.raillinebackend.repository.RailLineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MetaService {
    private final RailLineRepository railLineRepository;
    private final DiseaseTypeRepository diseaseTypeRepository;

    public MetaService(RailLineRepository railLineRepository, DiseaseTypeRepository diseaseTypeRepository) {
        this.railLineRepository = railLineRepository;
        this.diseaseTypeRepository = diseaseTypeRepository;
    }

    public List<RailLineResponse> findLines() {
        return railLineRepository.findAll().stream()
                .map(line -> new RailLineResponse(line.getId(), line.getCode(), line.getName(), line.getKmMin(), line.getKmMax()))
                .toList();
    }

    public List<DiseaseTypeResponse> findDiseaseTypes() {
        return diseaseTypeRepository.findAll().stream()
                .map(type -> new DiseaseTypeResponse(type.getId(), type.getCode(), type.getName()))
                .toList();
    }
}
