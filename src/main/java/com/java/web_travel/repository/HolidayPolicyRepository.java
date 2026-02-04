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

    // Tìm policy theo Hotel ID
    @Query("SELECT p FROM HolidayPolicy p WHERE p.hotel.id = :hotelId AND :date BETWEEN p.startDate AND p.endDate")
    List<HolidayPolicy> findActivePoliciesByHotel(@Param("hotelId") Long hotelId, @Param("date") LocalDate date);

    // --- [HÀM MỚI THÊM ĐỂ CHECK TRÙNG] ---
    // Kiểm tra xem khách sạn (hotelId) đã có chính sách nào trong khoảng [newStart, newEnd] chưa
    @Query("SELECT COUNT(p) > 0 FROM HolidayPolicy p " +
            "WHERE p.hotel.id = :hotelId " +
            "AND p.startDate <= :newEnd " +
            "AND p.endDate >= :newStart")
    boolean existsOverlappingPolicyForHotel(@Param("hotelId") Long hotelId,
                                            @Param("newStart") LocalDate newStart,
                                            @Param("newEnd") LocalDate newEnd);

    // [THÊM MỚI] Tìm policy thuộc riêng về khách sạn này, sắp xếp mới nhất
    List<HolidayPolicy> findByHotelIdOrderByStartDateDesc(Long hotelId);


    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END " +
            "FROM HolidayPolicy p " +
            "WHERE p.hotel.id = :hotelId " +
            "AND p.id != :policyId " +  // Quan trọng: Trừ ID của chính nó ra
            "AND ((:startDate BETWEEN p.startDate AND p.endDate) " +
            "OR (:endDate BETWEEN p.startDate AND p.endDate) " +
            "OR (p.startDate BETWEEN :startDate AND :endDate))")
    boolean existsOverlappingExcludingSelf(@Param("hotelId") Long hotelId,
                                           @Param("policyId") Long policyId,
                                           @Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);

    // 1. Lấy tất cả Policy của GROUP nằm trong khoảng khách đặt (overlap)
    @Query("SELECT p FROM HolidayPolicy p WHERE p.targetGroup.id = :groupId " +
            "AND p.startDate <= :endDate AND p.endDate >= :startDate")
    List<HolidayPolicy> findByGroupIdAndDateRange(@Param("groupId") Long groupId,
                                                  @Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate);

    // 2. Lấy tất cả Policy của HOTEL LẺ nằm trong khoảng khách đặt (overlap)
    @Query("SELECT p FROM HolidayPolicy p WHERE p.hotel.id = :hotelId " +
            "AND p.startDate <= :endDate AND p.endDate >= :startDate")
    List<HolidayPolicy> findByHotelIdAndDateRange(@Param("hotelId") Long hotelId,
                                                  @Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate);
}