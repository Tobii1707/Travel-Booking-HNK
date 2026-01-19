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

    // 1. Các hàm cơ bản theo User
    List<Order> findByUserId(Long userId);

    // Hai hàm này chức năng giống nhau, bạn có thể giữ cả 2 hoặc dùng 1 cái tùy sở thích
    Page<Order> findByUser(User user, Pageable pageable);
    Page<Order> findByUserId(Long userId, Pageable pageable);

    // 2. Tìm theo Flight (Chuyến bay)
    List<Order> findByFlight(Flight flight);

    // --- MỚI: GỢI Ý THÊM CÁC HÀM TÌM KIẾM MỚI ---

    // Tìm các đơn hàng theo Điểm đến (VD: Admin muốn xem ai đang đi Đà Nẵng)
    Page<Order> findByDestinationContainingIgnoreCase(String destination, Pageable pageable);

    // Tìm các đơn hàng theo Nơi xuất phát (Trường mới bạn vừa thêm)
    Page<Order> findByCurrentLocationContainingIgnoreCase(String currentLocation, Pageable pageable);

    // --- CÁC QUERY PHỨC TẠP (Admin/Thống kê) ---

    // Đếm số đơn hàng có trạng thái cụ thể của một khách sạn
    @Query("SELECT COUNT(o) FROM Order o WHERE o.hotel.id = :hotelId AND o.status IN (:statuses)")
    long countActiveOrdersByHotel(
            @Param("hotelId") Long hotelId,
            @Param("statuses") List<OrderStatus> statuses
    );

    // Hủy hàng loạt đơn hàng của một khách sạn (Dùng khi khách sạn bị xóa hoặc đóng cửa)
    @Modifying
    @Query("UPDATE Order o SET o.status = :cancelStatus WHERE o.hotel.id = :hotelId AND o.status IN (:activeStatuses)")
    void cancelAllActiveOrdersByHotel(
            @Param("hotelId") Long hotelId,
            @Param("activeStatuses") List<OrderStatus> activeStatuses,
            @Param("cancelStatus") OrderStatus cancelStatus
    );
}