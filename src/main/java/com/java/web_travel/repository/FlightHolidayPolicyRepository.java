package com.java.web_travel.repository;

import com.java.web_travel.entity.FlightHolidayPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface FlightHolidayPolicyRepository extends JpaRepository<FlightHolidayPolicy, Long> {

    // 1. Tìm các chính sách bao trùm ngày cất cánh của chuyến bay
    // Thay vì truyền flightId và ngày hiện tại, ta chỉ truyền ngày cất cánh (targetDate) vào để kiểm tra
    @Query("SELECT p FROM FlightHolidayPolicy p WHERE :targetDate BETWEEN p.startDate AND p.endDate")
    List<FlightHolidayPolicy> findPoliciesCoveringDate(@Param("targetDate") LocalDate targetDate);

    // 2. Kiểm tra trùng lặp thời gian khi Admin tạo mới một chính sách
    // Bỏ check theo flightId, chỉ check xem khoảng thời gian (startDate -> endDate) có bị giao nhau với chính sách nào đã có không
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM FlightHolidayPolicy p " +
            "WHERE (p.startDate <= :endDate AND p.endDate >= :startDate)")
    boolean existsOverlappingPolicy(@Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate);

    // 3. Lấy tất cả chính sách sắp xếp theo ngày bắt đầu mới nhất (để hiển thị lên bảng cho Admin)
    List<FlightHolidayPolicy> findAllByOrderByStartDateDesc();

    // 4. Kiểm tra trùng lặp thời gian nhưng LOẠI TRỪ chính sách đang được cập nhật (dùng khi Admin Edit)
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM FlightHolidayPolicy p " +
            "WHERE (p.startDate <= :endDate AND p.endDate >= :startDate) AND p.id != :policyId")
    boolean existsOverlappingPolicyExcludingId(@Param("startDate") LocalDate startDate,
                                               @Param("endDate") LocalDate endDate,
                                               @Param("policyId") Long policyId);
}