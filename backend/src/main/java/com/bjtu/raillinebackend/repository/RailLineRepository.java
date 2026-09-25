package com.bjtu.raillinebackend.repository;


import com.bjtu.raillinebackend.entity.RailLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RailLineRepository extends JpaRepository<RailLine, Long> {}
