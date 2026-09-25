package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.dto.DetectionResponse;
import com.bjtu.raillinebackend.dto.DiseaseDetailResponse;
import com.bjtu.raillinebackend.dto.LedgerResponse;
import com.bjtu.raillinebackend.dto.PageResponse;
import com.bjtu.raillinebackend.entity.Severity;
import com.bjtu.raillinebackend.entity.Detection;
import com.bjtu.raillinebackend.entity.Ledger;
import com.bjtu.raillinebackend.exception.ResourceNotFoundException;
import com.bjtu.raillinebackend.repository.DetectionRepository;
import com.bjtu.raillinebackend.repository.LedgerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class RailDataService {
    private final DetectionRepository detectionRepository;
    private final LedgerRepository ledgerRepository;

    public RailDataService(DetectionRepository detectionRepository, LedgerRepository ledgerRepository) {
        this.detectionRepository = detectionRepository;
        this.ledgerRepository = ledgerRepository;
    }

    public PageResponse<DetectionResponse> findDetections(String line, String type, String types, Severity severity,
                                                           LocalDate start, LocalDate end, String query,
                                                           Integer minMileage, Integer maxMileage,
                                                           int page, int size, String sortDir) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        DiseaseTypeSelection selection = DiseaseTypeSelection.fromCsv(types);
        return PageResponse.from(detectionRepository.search(line, type, selection.enabled(), selection.values(),
                severity, start, end, query, minMileage, maxMileage,
                PageRequest.of(page, size, Sort.by(direction, "detectDate"))).map(this::toDetectionResponse));
    }

    public PageResponse<LedgerResponse> findLedgers(String line, String type, String types, Severity severity,
                                                     LocalDate start, LocalDate end, String query,
                                                     Integer minMileage, Integer maxMileage,
                                                     int page, int size, String sortDir) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        DiseaseTypeSelection selection = DiseaseTypeSelection.fromCsv(types);
        return PageResponse.from(ledgerRepository.search(line, type, selection.enabled(), selection.values(),
                severity, start, end, query, minMileage, maxMileage,
                PageRequest.of(page, size, Sort.by(direction, "recordDate"))).map(this::toLedgerResponse));
    }

    public DiseaseDetailResponse findDetail(String id) {
        DetectionResponse detection = detectionRepository.findById(id).map(this::toDetectionResponse).orElse(null);
        LedgerResponse ledger = ledgerRepository.findById(id).map(this::toLedgerResponse).orElse(null);
        if (detection == null && ledger == null) {
            throw new ResourceNotFoundException("Disease detail", id);
        }
        return new DiseaseDetailResponse(detection, ledger);
    }

    private DetectionResponse toDetectionResponse(Detection source) {
        return new DetectionResponse(source.getId(), source.getLineName(), source.getLocation(), source.getTypeName(),
                source.getDetectDate(), source.getSeverity(), source.getDescription(), source.getInspector(),
                source.getSuggestion(), source.getHistory());
    }

    private LedgerResponse toLedgerResponse(Ledger source) {
        return new LedgerResponse(source.getId(), source.getLineName(), source.getLocation(), source.getTypeName(),
                source.getRecordDate(), source.getSeverity(), source.getDescription(), source.getRecorder(),
                source.getSuggestion(), source.getHistory());
    }
}
