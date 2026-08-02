package com.bjtu.raillinebackend.repository;


import com.bjtu.raillinebackend.entity.rail_line;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RailLineRepository extends JpaRepository<rail_line, Long> {}
