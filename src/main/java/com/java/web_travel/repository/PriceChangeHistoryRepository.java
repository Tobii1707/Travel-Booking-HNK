package com.java.web_travel.repository;

import com.java.web_travel.entity.PriceChangeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceChangeHistoryRepository extends JpaRepository<PriceChangeHistory, Long> {
    List<PriceChangeHistory> findByHotelIdOrderByChangeDateDesc(Long hotelId);
}