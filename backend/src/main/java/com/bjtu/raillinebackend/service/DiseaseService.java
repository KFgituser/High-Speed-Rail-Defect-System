package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.dto.DiseaseQueryRequest;
import com.bjtu.raillinebackend.entity.diseaseType;
import com.bjtu.raillinebackend.repository.DiseaseTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiseaseService {

    private final DiseaseTypeRepository diseaseRepository;

    public Page<diseaseType> search(DiseaseQueryRequest req) {
        // 1) 排序
        Sort.Direction dir = "ASC".equalsIgnoreCase(req.getSortDir()) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(dir, req.getSortBy() == null ? "detectedAt" : req.getSortBy());

        // 2) 分页
        int page = req.getPage() == null || req.getPage() < 0 ? 0 : req.getPage();
        int size = req.getSize() == null || req.getSize() <= 0 ? 20 : req.getSize();
        Pageable pageable = PageRequest.of(page, size, sort);

        // 3) 条件（Specification）
        Specification<diseaseType> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();

            if (req.getLineName() != null && !req.getLineName().isBlank()) {
                ps.add(cb.equal(root.get("lineName"), req.getLineName()));
            }
            if (req.getTypes() != null && !req.getTypes().isEmpty()) {
                ps.add(root.get("type").in(req.getTypes()));
            }
            if (req.getSeverities() != null && !req.getSeverities().isEmpty()) {
                ps.add(root.get("severity").in(req.getSeverities()));
            }
            if (req.getDateFrom() != null && req.getDateTo() != null) {
                ps.add(cb.between(root.get("detectedAt"), req.getDateFrom(), req.getDateTo()));
            } else if (req.getDateFrom() != null) {
                ps.add(cb.greaterThanOrEqualTo(root.get("detectedAt"), req.getDateFrom()));
            } else if (req.getDateTo() != null) {
                ps.add(cb.lessThanOrEqualTo(root.get("detectedAt"), req.getDateTo()));
            }
            if (req.getKeyword() != null && !req.getKeyword().isBlank()) {
                String like = "%" + req.getKeyword().trim() + "%";
                ps.add(cb.or(
                        cb.like(root.get("description"), like),
                        cb.like(root.get("location"), like),
                        cb.like(root.get("reporter"), like)
                ));
            }

            return cb.and(ps.toArray(new Predicate[0]));
        };

        // 4) 执行
        return diseaseRepository.findAll(spec, pageable);
    }

    public diseaseType getById(Long id) {
        return diseaseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Disease not found: " + id));
    }

    public diseaseType save(diseaseType d) {
        return diseaseRepository.save(d);
    }

    public void delete(Long id) {
        diseaseRepository.deleteById(id);
    }
}
