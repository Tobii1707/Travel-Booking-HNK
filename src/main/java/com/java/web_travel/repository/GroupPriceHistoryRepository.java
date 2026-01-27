package com.java.web_travel.repository;

import com.java.web_travel.entity.GroupPriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupPriceHistoryRepository extends JpaRepository<GroupPriceHistory, Long> {

    // Hàm tìm kiếm lịch sử theo ID tập đoàn, sắp xếp mới nhất lên đầu
    // Hibernate sẽ tự generate câu SQL dựa trên tên hàm này
    List<GroupPriceHistory> findByHotelGroupIdOrderByCreatedAtDesc(Long groupId);
}