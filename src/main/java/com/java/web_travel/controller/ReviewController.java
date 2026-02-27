package com.java.web_travel.controller;

import com.java.web_travel.model.request.ReviewRequestDTO;
import com.java.web_travel.model.response.ReviewResponse;
import com.java.web_travel.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // 1. Tạo đánh giá mới
    @PostMapping("/submit")
    public ResponseEntity<?> submitReview(
            @RequestHeader("userId") Long userId,
            @Valid @RequestBody ReviewRequestDTO request) {

        reviewService.createReview(userId, request);
        return ResponseEntity.ok("Đánh giá thành công! Cảm ơn bạn đã phản hồi.");
    }

    // 2. [MỚI THÊM] Cập nhật đánh giá
    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(
            @RequestHeader("userId") Long userId,
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequestDTO request) {

        // Gọi xuống service đã viết ở bước trước
        reviewService.updateReview(userId, reviewId, request);
        return ResponseEntity.ok("Cập nhật đánh giá thành công!");
    }

    // 3. Xem lịch sử đánh giá của chính mình
    @GetMapping("/my-reviews")
    public ResponseEntity<List<ReviewResponse>> getMyReviews(@RequestHeader("userId") Long userId) {
        List<ReviewResponse> reviews = reviewService.getMyReviews(userId);
        return ResponseEntity.ok(reviews);
    }

    // 4. Xem chi tiết đánh giá của 1 đơn hàng cụ thể
    @GetMapping("/order/{orderId}")
    public ResponseEntity<ReviewResponse> getReviewByOrderId(@PathVariable Long orderId) {
        ReviewResponse review = reviewService.getReviewByOrderId(orderId);
        return ResponseEntity.ok(review);
    }

    // 5. Xem tất cả đánh giá của mọi người (Public - Có phân trang)
    @GetMapping("/public")
    public ResponseEntity<Page<ReviewResponse>> getAllPublicReviews(
            @PageableDefault(page = 0, size = 10) Pageable pageable) {
        Page<ReviewResponse> reviewPage = reviewService.getAllPublicReviews(pageable);
        return ResponseEntity.ok(reviewPage);
    }

    // 6. [ĐÃ SỬA LẠI CHUẨN] Lấy chi tiết 1 đánh giá theo ID
    @GetMapping("/{reviewId}")
    public ResponseEntity<?> getReviewById(@PathVariable Long reviewId) {
        // Đã bỏ String id và try-catch thủ công.
        // Spring sẽ tự động báo lỗi 400 Bad Request nếu FE truyền "1:1" hay chữ cái vào đây.

        // GHI CHÚ: Nếu bạn đã viết hàm getReviewById trong Service thì mở comment dòng dưới ra dùng nhé.
        // ReviewResponse review = reviewService.getReviewById(reviewId);
        // return ResponseEntity.ok(review);

        return ResponseEntity.ok("Đã gọi thành công API với ID: " + reviewId);
    }
}