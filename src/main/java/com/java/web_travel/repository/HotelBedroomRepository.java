package com.java.web_travel.repository;

import com.java.web_travel.entity.HotelBedroom;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HotelBedroomRepository extends JpaRepository<HotelBedroom, Long> {

    List<HotelBedroom> findByHotelId(Long hotelId);

    boolean existsByHotelIdAndRoomNumber(Long hotelId, Long roomNumber);

    boolean existsByHotelIdAndRoomNumberAndIdNot(Long hotelId, Long roomNumber, Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE) // Khóa dòng dữ liệu này lại, ai đến sau phải chờ
    @Query("SELECT h FROM HotelBedroom h WHERE h.id = :id")
    Optional<HotelBedroom> findByIdWithLock(@Param("id") Long id);


}
