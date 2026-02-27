package com.java.web_travel.repository;

import com.java.web_travel.entity.Airline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AirlineRepository extends JpaRepository<Airline, Long> {

    // Kiểm tra tên đã tồn tại chưa (tránh trùng lặp)
    boolean existsByAirlineName(String airlineName);

    // Chỉ lấy các hãng chưa bị xóa mềm
    List<Airline> findByDeletedFalse();

    List<Airline> findByDeletedTrue();
}