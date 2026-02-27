package com.java.web_travel.service;

import com.java.web_travel.entity.Review;
import com.java.web_travel.model.request.ReviewRequestDTO;
import com.java.web_travel.model.response.ReviewResponse; // Thêm import
import org.springframework.data.domain.Page; // Thêm import
import org.springframework.data.domain.Pageable; // Thêm import

import java.util.List; // Thêm import

public interface ReviewService {

    // Hàm tạo đánh giá gốc của bạn
    Review createReview(Long userId, ReviewRequestDTO request);


    // 1. Xem danh sách đánh giá của chính mình
    List<ReviewResponse> getMyReviews(Long userId);

    // 2. Xem chi tiết đánh giá của một đơn hàng cụ thể
    ReviewResponse getReviewByOrderId(Long orderId);

    // 3. Xem tất cả đánh giá (Public) có hỗ trợ phân trang
    Page<ReviewResponse> getAllPublicReviews(Pageable pageable);

    Review updateReview(Long userId, Long reviewId, ReviewRequestDTO request);
}