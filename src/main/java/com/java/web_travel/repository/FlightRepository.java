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

    // 1. Giữ nguyên các hàm cơ bản (nếu bạn vẫn dùng ở đâu đó)
    List<Flight> findByDepartureLocationAndArrivalLocation(String departureLocation, String arrivalLocation);

    // 2. Hàm QUAN TRỌNG NHẤT cho chức năng gợi ý
    // Logic: Tìm điểm đi/đến (gần đúng) + Phải chưa bay (Tương lai) + Sắp xếp chuyến sớm nhất lên đầu
    @Query("SELECT f FROM Flight f WHERE " +
            "LOWER(f.departureLocation) LIKE LOWER(CONCAT('%', :from, '%')) AND " +
            "LOWER(f.arrivalLocation) LIKE LOWER(CONCAT('%', :to, '%')) AND " +
            "f.checkInDate > CURRENT_TIMESTAMP " +
            "ORDER BY f.checkInDate ASC")
    List<Flight> findSuggestedFlights(@Param("from") String from, @Param("to") String to);

    // 3. (Tùy chọn) Hàm tìm kiếm Admin (không quan tâm ngày cũ mới, để Admin quản lý)
    @Query("SELECT f FROM Flight f WHERE " +
            "LOWER(f.departureLocation) LIKE LOWER(CONCAT('%', :from, '%')) AND " +
            "LOWER(f.arrivalLocation) LIKE LOWER(CONCAT('%', :to, '%'))")
    List<Flight> searchFlightAdmin(@Param("from") String departureLocation, @Param("to") String arrivalLocation);
}