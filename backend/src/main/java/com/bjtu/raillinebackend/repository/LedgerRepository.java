package com.bjtu.raillinebackend.repository;



import com.bjtu.raillinebackend.entity.Ledger;
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
public interface LedgerRepository extends JpaRepository<Ledger, String> {

    @Query("""
      select l from ledger l
      where (:line is null or l.lineName = :line)
        and (:type is null or l.typeName = :type)
        and (:typesEnabled = false or l.typeName in :types)
        and (:sev  is null or l.severity = :sev)
        and (:start is null or l.recordDate >= :start)
        and (:end   is null or l.recordDate <= :end)
        and (:q is null or l.description like concat('%',:q,'%') or l.location like concat('%',:q,'%'))
        and (:minMileage is null or (case when function('regexp_like', l.location, '^K[0-9]+[+][0-9]{1,3}$') = true then
          cast(substring(l.location, 2, locate('+', l.location) - 2) as integer) * 1000
          + cast(substring(l.location, locate('+', l.location) + 1) as integer)
          else -1 end) >= :minMileage)
        and (:maxMileage is null or (case when function('regexp_like', l.location, '^K[0-9]+[+][0-9]{1,3}$') = true then
          cast(substring(l.location, 2, locate('+', l.location) - 2) as integer) * 1000
          + cast(substring(l.location, locate('+', l.location) + 1) as integer)
          else -1 end) <= :maxMileage)
    """)
    Page<Ledger> search(String line, String type, boolean typesEnabled, List<String> types,
                        Severity sev, LocalDate start, LocalDate end, String q,
                        Integer minMileage, Integer maxMileage, Pageable pageable);

    @Query("select l from ledger l where (:start is null or l.recordDate >= :start) and (:end is null or l.recordDate <= :end)")
    List<Ledger> findByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);
}

