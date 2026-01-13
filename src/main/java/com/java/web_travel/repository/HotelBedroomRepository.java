package com.java.web_travel.repository;

import com.java.web_travel.entity.HotelBedroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HotelBedroomRepository extends JpaRepository<HotelBedroom, Long> {

    List<HotelBedroom> findByHotelId(Long hotelId);

    boolean existsByHotelIdAndRoomNumber(Long hotelId, Long roomNumber);

    boolean existsByHotelIdAndRoomNumberAndIdNot(Long hotelId, Long roomNumber, Long id);
}
