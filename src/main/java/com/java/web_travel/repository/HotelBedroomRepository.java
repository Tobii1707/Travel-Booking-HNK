package com.java.web_travel.repository;

import com.java.web_travel.entity.HotelBedroom;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
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

    @Modifying // Bắt buộc dùng khi update/delete dữ liệu
    @Transactional // Đảm bảo tính toàn vẹn dữ liệu
    @Query("UPDATE HotelBedroom b SET b.price = b.price + (b.price * :percentage / 100.0) " +
            "WHERE b.hotel.hotelGroup.id = :groupId")
    void updatePriceByGroupId(@Param("groupId") Long groupId, @Param("percentage") Double percentage);

    @Modifying
    @Transactional
    @Query("UPDATE HotelBedroom b SET b.price = :newPrice WHERE b.hotel.id = :hotelId")
    void updatePriceByHotelId(@Param("hotelId") Long hotelId, @Param("newPrice") Double newPrice);

    // Dùng cho chức năng Tăng giá Tập đoàn (Bulk Update)
    List<HotelBedroom> findByHotelIdIn(List<Long> hotelIds);
}
