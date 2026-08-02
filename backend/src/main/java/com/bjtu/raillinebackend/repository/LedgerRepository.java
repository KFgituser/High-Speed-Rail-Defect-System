package com.bjtu.raillinebackend.repository;



import com.bjtu.raillinebackend.entity.ledger;
import com.bjtu.raillinebackend.entity.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface LedgerRepository extends JpaRepository<ledger, String> {

    @Query("""
      select l from ledger l
      where (:line is null or l.lineName = :line)
        and (:type is null or l.typeName = :type)
        and (:sev  is null or l.severity = :sev)
        and (:start is null or l.recordDate >= :start)
        and (:end   is null or l.recordDate <= :end)
        and (:q is null or l.description like concat('%',:q,'%') or l.location like concat('%',:q,'%'))
    """)
    List<ledger> search(String line, String type, Severity sev,
                        LocalDate start, LocalDate end, String q);

    @Query("select l from ledger l where (:start is null or l.recordDate >= :start) and (:end is null or l.recordDate <= :end)")
    List<ledger> findByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);
}

