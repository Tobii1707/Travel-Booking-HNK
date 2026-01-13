package com.java.web_travel.repository;

import com.java.web_travel.entity.HotelBooking;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface HotelBookingRepository extends JpaRepository<HotelBooking, Long> {
    @Query("select hb from HotelBooking hb " +
            "where hb.hotel.id = :hotelId " +
            "  and hb.hotelBedroom.id = :hotelBedroomId " +
            "  and (:startDate < hb.endDate and :endDate > hb.startDate)")
    List<HotelBooking> findOverLappingBookings(@Param("hotelId") Long hotelId,
                                               @Param("hotelBedroomId") Long hotelBedroomId,
                                               @Param("startDate") Date startDate,
                                               @Param("endDate") Date endDate);

    @Modifying
    @Transactional
    @Query("delete from HotelBooking hb where hb.order.id = :orderId")
    void deleteByOrderId(@Param("orderId") Long orderId);
}
