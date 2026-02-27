package com.java.web_travel.service.impl;

import com.java.web_travel.entity.Order;
import com.java.web_travel.entity.Review;
import com.java.web_travel.entity.User; // Thêm import
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.enums.PaymentStatus;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.ReviewRequestDTO;
import com.java.web_travel.model.response.ReviewResponse; // Thêm import
import com.java.web_travel.repository.OrderRepository;
import com.java.web_travel.repository.ReviewRepository;
import com.java.web_travel.repository.UserRepository; // Thêm import
import com.java.web_travel.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page; // Thêm import
import org.springframework.data.domain.Pageable; // Thêm import
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List; // Thêm import
import java.util.stream.Collectors; // Thêm import

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository; // Bổ sung UserRepository để lấy tên người dùng

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Review createReview(Long userId, ReviewRequestDTO request) {

        // 1. Kiểm tra Order có tồn tại không
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // 2. Xác thực quyền (Chỉ người đặt Order này mới được đánh giá)
        if (!order.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.REVIEW_UNAUTHORIZED);
        }

        // 3. ĐIỀU KIỆN TIÊN QUYẾT: Đơn hàng phải ở trạng thái ĐÃ THANH TOÁN (PAID)
        if (order.getPayment() == null || order.getPayment().getStatus() != PaymentStatus.PAID) {
            throw new AppException(ErrorCode.ORDER_NOT_PAID);
        }

        // 4. Kiểm tra xem Order này đã được đánh giá trước đó chưa
        if (reviewRepository.existsByOrderId(request.getOrderId())) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        // 5. Lưu Review mới
        Review review = new Review();
        review.setUserId(userId);
        review.setOrderId(request.getOrderId());
        review.setFlightRating(request.getFlightRating());
        review.setHotelRating(request.getHotelRating());
        review.setWebsiteRating(request.getWebsiteRating());
        review.setComment(request.getComment());

        return reviewRepository.save(review);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Review updateReview(Long userId, Long reviewId, ReviewRequestDTO request) {
        // 1. Tìm đánh giá theo reviewId
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

        // 2. Xác thực quyền: Chỉ chủ nhân của bài đánh giá mới được phép sửa
        if (!review.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.REVIEW_UNAUTHORIZED);
        }

        // 3. Validate dữ liệu đầu vào (Service level)
        validateRating(request.getFlightRating());
        validateRating(request.getHotelRating());
        validateRating(request.getWebsiteRating());

        if (request.getComment() == null || request.getComment().trim().isEmpty()) {
            // Giả định bạn có ErrorCode.INVALID_COMMENT (Nội dung đánh giá không được để trống)
            throw new AppException(ErrorCode.INVALID_COMMENT);
        }

        // Có thể giới hạn độ dài comment nếu cần
        if (request.getComment().length() > 1000) {
            throw new AppException(ErrorCode.COMMENT_TOO_LONG);
        }

        // 4. Cập nhật các trường thông tin
        // Lưu ý: Không cập nhật orderId hay userId để đảm bảo tính nhất quán của dữ liệu
        review.setFlightRating(request.getFlightRating());
        review.setHotelRating(request.getHotelRating());
        review.setWebsiteRating(request.getWebsiteRating());
        review.setComment(request.getComment());

        // 5. Lưu lại vào database
        return reviewRepository.save(review);
    }

    // --- Hàm Helper nội bộ để Validate Rating ---
    private void validateRating(Integer rating) {
        // Nếu bạn cho phép rating = null (tức là không đánh giá phần đó), thì thêm check != null
        // Nếu bắt buộc phải có, hãy bỏ `rating != null`
        if (rating != null && (rating < 1 || rating > 5)) {
            // Giả định bạn có ErrorCode.INVALID_RATING (Điểm đánh giá phải từ 1 đến 5)
            throw new AppException(ErrorCode.INVALID_RATING);
        }
    }

    /**
     * 1. Lấy danh sách đánh giá của CHÍNH MÌNH
     */
    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(Long userId) {
        // Lưu ý: Cần thêm hàm findByUserIdOrderByCreatedAtDesc(Long userId) vào ReviewRepository
        List<Review> reviews = reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return reviews.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * 2. Lấy đánh giá của một đơn hàng cụ thể
     */
    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReviewByOrderId(Long orderId) {
        // Lưu ý: Cần thêm hàm findByOrderId(Long orderId) vào ReviewRepository
        Review review = reviewRepository.findByOrderId(orderId)
                // Cần thêm REVIEW_NOT_FOUND vào ErrorCode nếu chưa có
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        return mapToResponse(review);
    }

    /**
     * 3. Xem đánh giá của TẤT CẢ mọi người (Public - Có phân trang)
     */
    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllPublicReviews(Pageable pageable) {
        Page<Review> reviewPage = reviewRepository.findAll(pageable);
        return reviewPage.map(this::mapToResponse);
    }

    // --- Hàm Helper nội bộ để map từ Entity sang Response ---
    private ReviewResponse mapToResponse(Review review) {
        String authorName = "Khách hàng";
        if (review.getUserId() != null) {
            authorName = userRepository.findById(review.getUserId())
                    .map(User::getFullName) // Giả định Entity User có hàm getFullName()
                    .orElse("Khách hàng ẩn danh");
        }

        // --- BỔ SUNG MỚI: Truy vấn Order để lấy tên Khách sạn & Chuyến bay ---
        String hotelName = "Không sử dụng";
        String flightName = "Không sử dụng";

        Order order = orderRepository.findById(review.getOrderId()).orElse(null);
        if (order != null) {
            // Lưu ý: Thay đổi getHotelName() và getFlightName() cho khớp với Entity của bạn
            if (order.getHotel() != null) {
                hotelName = order.getHotel().getHotelName();
            }
            if (order.getFlight() != null) {
                flightName = order.getFlight().getAirplaneName();
            }
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .orderId(review.getOrderId())
                .userId(review.getUserId())
                .authorName(authorName)
                .hotelName(hotelName)   // Thêm dòng này
                .flightName(flightName) // Thêm dòng này
                .flightRating(review.getFlightRating())
                .hotelRating(review.getHotelRating())
                .websiteRating(review.getWebsiteRating())
                .comment(review.getComment())
                .build();
    }
}