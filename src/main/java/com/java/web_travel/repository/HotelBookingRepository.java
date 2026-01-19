package com.java.web_travel.repository;

import com.java.web_travel.entity.HotelBooking;
// import jakarta.transaction.Transactional; // Không cần thiết ở đây nếu xử lý ở Service
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface HotelBookingRepository extends JpaRepository<HotelBooking, Long> {

    // 1. THÊM MỚI (QUAN TRỌNG): Hàm tìm kiếm Booking theo OrderId
    // Hàm này giúp Service lấy danh sách booking ra trước khi xóa
    List<HotelBooking> findByOrderId(Long orderId);


    // 2. Giữ nguyên hàm check trùng lịch
    @Query("select hb from HotelBooking hb " +
            "where hb.hotel.id = :hotelId " +
            "  and hb.hotelBedroom.id = :hotelBedroomId " +
            "  and (:startDate < hb.endDate and :endDate > hb.startDate)")
    List<HotelBooking> findOverLappingBookings(@Param("hotelId") Long hotelId,
                                               @Param("hotelBedroomId") Long hotelBedroomId,
                                               @Param("startDate") Date startDate,
                                               @Param("endDate") Date endDate);

    // 3. Hàm xóa cũ (Có thể giữ lại hoặc bỏ, nhưng khuyến khích dùng cách find + deleteAll ở Service)
    // Nếu bạn vẫn muốn dùng hàm này, hãy đảm bảo Service có @Transactional
    @Modifying
    @Query("delete from HotelBooking hb where hb.order.id = :orderId")
    void deleteByOrderId(@Param("orderId") Long orderId);

    // 4. Giữ nguyên hàm lấy danh sách phòng đã đặt (để tô màu đỏ)
    @Query("SELECT hb.hotelBedroom.id FROM HotelBooking hb " +
            "WHERE hb.hotel.id = :hotelId " +
            "AND (:startDate < hb.endDate AND :endDate > hb.startDate)")
    List<Long> findBookedRoomIds(@Param("hotelId") Long hotelId,
                                 @Param("startDate") Date startDate,
                                 @Param("endDate") Date endDate);
}