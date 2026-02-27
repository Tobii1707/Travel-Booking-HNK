package com.java.web_travel.repository;

import com.java.web_travel.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // (Đã có) Kiểm tra xem Order đã được đánh giá chưa
    boolean existsByOrderId(Long orderId);

    // 1. Lấy tất cả đánh giá của 1 User cụ thể (Dành cho chức năng xem lịch sử của mình)
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 2. Lấy đánh giá dựa trên Order ID
    Optional<Review> findByOrderId(Long orderId);

    // 3. Lấy tất cả đánh giá công khai có phân trang (Cho người khác xem)
    // Phân trang rất quan trọng vì sau này lượng Review sẽ rất lớn
    Page<Review> findAll(Pageable pageable);
}