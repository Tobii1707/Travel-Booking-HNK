package com.java.web_travel.repository;

import com.java.web_travel.entity.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {

    // 1. Lấy tất cả các chuyến bay CHƯA bị xóa (Dùng cho getAllFlights ở Admin)
    List<Flight> findByDeletedFalse();

    // 2. Lấy tất cả các chuyến bay ĐÃ BỊ XÓA (Dùng cho tính năng Thùng rác)
    List<Flight> findByDeletedTrue();

    // 3. Lấy danh sách chuyến bay theo ID Hãng bay (Dùng khi xóa mềm Hãng bay thì xóa/khôi phục luôn Chuyến bay)
    List<Flight> findByAirlineId(Long airlineId);

    // 4. Sửa lại tên hàm để Spring Data tự hiểu: Phải trùng điểm đi, điểm đến VÀ chưa bị xóa
    List<Flight> findByDepartureLocationAndArrivalLocationAndDeletedFalse(String departureLocation, String arrivalLocation);

    // 5. Hàm QUAN TRỌNG NHẤT cho chức năng gợi ý (Cho Khách hàng)
    @Query("SELECT f FROM Flight f WHERE " +
            "f.deleted = false AND " +
            "LOWER(f.departureLocation) LIKE LOWER(CONCAT('%', :from, '%')) AND " +
            "LOWER(f.arrivalLocation) LIKE LOWER(CONCAT('%', :to, '%')) AND " +
            "f.checkInDate > CURRENT_TIMESTAMP " +
            "ORDER BY f.checkInDate ASC")
    List<Flight> findSuggestedFlights(@Param("from") String from, @Param("to") String to);

    // 6. Hàm tìm kiếm Admin (Không quan tâm ngày cũ mới, chỉ quan tâm chưa bị xóa)
    @Query("SELECT f FROM Flight f WHERE " +
            "f.deleted = false AND " +
            "LOWER(f.departureLocation) LIKE LOWER(CONCAT('%', :from, '%')) AND " +
            "LOWER(f.arrivalLocation) LIKE LOWER(CONCAT('%', :to, '%'))")
    List<Flight> searchFlightAdmin(@Param("from") String departureLocation, @Param("to") String arrivalLocation);

    // Hàm kiểm tra trùng lịch bay
    @Query("SELECT COUNT(f) > 0 FROM Flight f WHERE f.airplaneName = :airplaneName " +
            "AND f.deleted = false " +
            "AND (f.checkInDate < :checkOutDate AND f.checkOutDate > :checkInDate)")
    boolean existsOverlappingFlight(@Param("airplaneName") String airplaneName,
                                    @Param("checkInDate") Date checkInDate,
                                    @Param("checkOutDate") Date checkOutDate);

    @Query("SELECT f FROM Flight f WHERE f.deleted = false " +
            "AND (:keyword IS NULL OR LOWER(f.airplaneName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:departure IS NULL OR f.departureLocation = :departure) " +
            "AND (:arrival IS NULL OR f.arrivalLocation = :arrival) " +
            "AND (:airlineId IS NULL OR f.airline.id = :airlineId)")
    List<Flight> searchFlightsForAdmin(@Param("keyword") String keyword,
                                       @Param("departure") String departure,
                                       @Param("arrival") String arrival,
                                       @Param("airlineId") Long airlineId);
}