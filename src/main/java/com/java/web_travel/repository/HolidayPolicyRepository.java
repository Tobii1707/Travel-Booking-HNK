package com.java.web_travel.repository;

import com.java.web_travel.entity.HolidayPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HolidayPolicyRepository extends JpaRepository<HolidayPolicy, Long> {

    @Query("SELECT p FROM HolidayPolicy p WHERE p.targetGroup.id = :groupId " +
            "AND :dateToCheck BETWEEN p.startDate AND p.endDate")
    List<HolidayPolicy> findActivePolicies(@Param("groupId") Long groupId,
                                           @Param("dateToCheck") LocalDate dateToCheck);

    // HÀM MỚI: Kiểm tra xem có policy nào của Group bị trùng ngày không
    @Query("SELECT COUNT(p) > 0 FROM HolidayPolicy p " +
            "WHERE p.targetGroup.id = :groupId " +
            "AND p.startDate <= :newEnd " +
            "AND p.endDate >= :newStart")
    boolean existsOverlappingPolicy(@Param("groupId") Long groupId,
                                    @Param("newStart") LocalDate newStart,
                                    @Param("newEnd") LocalDate newEnd);

    // [FIX] Sửa p.hotelGroup thành p.targetGroup cho đồng bộ với Entity của bạn
    @Query("SELECT COUNT(p) > 0 FROM HolidayPolicy p " +
            "WHERE p.targetGroup.id = :groupId " +  // <--- ĐÃ SỬA Ở ĐÂY
            "AND p.id <> :excludedId " +
            "AND p.startDate <= :newEnd " +
            "AND p.endDate >= :newStart")
    boolean existsOverlappingPolicyExceptId(@Param("groupId") Long groupId,
                                            @Param("newStart") LocalDate newStart,
                                            @Param("newEnd") LocalDate newEnd,
                                            @Param("excludedId") Long excludedId);
}