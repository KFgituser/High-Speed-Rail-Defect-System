package com.bjtu.raillinebackend.repository;

import com.bjtu.raillinebackend.entity.DiseaseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiseaseTypeRepository extends JpaRepository<DiseaseType, Long>, JpaSpecificationExecutor<DiseaseType> {

    List<DiseaseType> findByName(String name);
    List<DiseaseType> findByCode(String code);

}
