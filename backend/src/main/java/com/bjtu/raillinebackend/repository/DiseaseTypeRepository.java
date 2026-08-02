package com.bjtu.raillinebackend.repository;

import com.bjtu.raillinebackend.entity.diseaseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiseaseTypeRepository extends JpaRepository<diseaseType, Long>, JpaSpecificationExecutor<diseaseType> {

    List<diseaseType> findByName(String name);
    List<diseaseType> findByCode(String code);

}
