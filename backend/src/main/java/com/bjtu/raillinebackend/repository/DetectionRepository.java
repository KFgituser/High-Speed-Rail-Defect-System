package com.bjtu.raillinebackend.repository;


import com.bjtu.raillinebackend.entity.detection;
import com.bjtu.raillinebackend.entity.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DetectionRepository extends JpaRepository<detection, String> {

    @Query("""
      select d from detection d
      where (:line is null or d.lineName = :line)
        and (:type is null or d.typeName = :type)
        and (:sev  is null or d.severity = :sev)
        and (:start is null or d.detectDate >= :start)
        and (:end   is null or d.detectDate <= :end)
        and (:q is null or d.description like concat('%',:q,'%') or d.location like concat('%',:q,'%'))
    """)
    List<detection> search(String line, String type, Severity sev,
                           LocalDate start, LocalDate end, String q);

    @Query("select d from detection d where (:start is null or d.detectDate >= :start) and (:end is null or d.detectDate <= :end)")
    List<detection> findByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);

}
