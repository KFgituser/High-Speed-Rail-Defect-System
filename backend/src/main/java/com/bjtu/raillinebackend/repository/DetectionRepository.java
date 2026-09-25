package com.bjtu.raillinebackend.repository;


import com.bjtu.raillinebackend.entity.Detection;
import com.bjtu.raillinebackend.entity.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DetectionRepository extends JpaRepository<Detection, String> {

    @Query("""
      select d from detection d
      where (:line is null or d.lineName = :line)
        and (:type is null or d.typeName = :type)
        and (:typesEnabled = false or d.typeName in :types)
        and (:sev  is null or d.severity = :sev)
        and (:start is null or d.detectDate >= :start)
        and (:end   is null or d.detectDate <= :end)
        and (:q is null or d.description like concat('%',:q,'%') or d.location like concat('%',:q,'%'))
        and (:minMileage is null or (case when function('regexp_like', d.location, '^K[0-9]+[+][0-9]{1,3}$') = true then
          cast(substring(d.location, 2, locate('+', d.location) - 2) as integer) * 1000
          + cast(substring(d.location, locate('+', d.location) + 1) as integer)
          else -1 end) >= :minMileage)
        and (:maxMileage is null or (case when function('regexp_like', d.location, '^K[0-9]+[+][0-9]{1,3}$') = true then
          cast(substring(d.location, 2, locate('+', d.location) - 2) as integer) * 1000
          + cast(substring(d.location, locate('+', d.location) + 1) as integer)
          else -1 end) <= :maxMileage)
    """)
    Page<Detection> search(String line, String type, boolean typesEnabled, List<String> types,
                           Severity sev, LocalDate start, LocalDate end, String q,
                           Integer minMileage, Integer maxMileage, Pageable pageable);

    @Query("select d from detection d where (:start is null or d.detectDate >= :start) and (:end is null or d.detectDate <= :end)")
    List<Detection> findByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);

}
