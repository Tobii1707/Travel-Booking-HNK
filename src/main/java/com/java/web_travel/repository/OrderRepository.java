package com.java.web_travel.repository;

import com.java.web_travel.entity.Flight;
import com.java.web_travel.entity.Order;
import com.java.web_travel.entity.User;
import com.java.web_travel.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // --- 1. TÌM KIẾM THEO USER (KHÔI PHỤC LẠI ĐẦY ĐỦ) ---

    // Tìm List theo ID (Dùng cho các logic logic nhỏ)
    List<Order> findByUserId(Long userId);

    // Tìm Page theo ID (Dùng cho phân trang nếu cần)
    Page<Order> findByUserId(Long userId, Pageable pageable);

    // [QUAN TRỌNG] ĐÂY LÀ HÀM BẠN BỊ THIẾU -> GÂY LỖI SERVICE
    // Service đang gọi: orderRepository.findByUser(user, pageable)
    Page<Order> findByUser(User user, Pageable pageable);


    // --- 2. TÌM KIẾM KHÁC ---

    // Tìm theo Flight (Nếu Order có liên kết với Flight)
    List<Order> findByFlight(Flight flight);

    // Tìm kiếm theo từ khóa
    Page<Order> findByDestinationContainingIgnoreCase(String destination, Pageable pageable);
    Page<Order> findByCurrentLocationContainingIgnoreCase(String currentLocation, Pageable pageable);

    // --- 3. CÁC HÀM HỖ TRỢ HOTEL SERVICE (GIỮ NGUYÊN) ---

    @Query("SELECT COUNT(o) FROM Order o WHERE o.hotel.id = :hotelId AND o.status IN :statuses")
    long countActiveOrdersByHotel(
            @Param("hotelId") Long hotelId,
            @Param("statuses") List<OrderStatus> statuses
    );

    @Modifying
    @Query("UPDATE Order o SET o.status = :cancelStatus WHERE o.hotel.id = :hotelId AND o.status IN :activeStatuses")
    void cancelAllActiveOrdersByHotel(
            @Param("hotelId") Long hotelId,
            @Param("activeStatuses") List<OrderStatus> activeStatuses,
            @Param("cancelStatus") OrderStatus cancelStatus
    );
}