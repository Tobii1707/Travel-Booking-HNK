package com.java.web_travel.repository;

import com.java.web_travel.entity.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long> {

    // --- CÁC CHỨC NĂNG CŨ (GIỮ NGUYÊN) ---

    @Query(value = "SELECT * FROM hotels h " +
            "WHERE LOWER(REPLACE(h.address, ' ', '')) " +
            "LIKE CONCAT('%', LOWER(REPLACE(:destination, ' ', '')), '%')",
            nativeQuery = true)
    List<Hotel> findByDestination(@Param("destination") String destination);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.hotel.id = :hotelId AND o.status NOT IN ('COMPLETED', 'CANCELLED')")
    long countActiveOrdersByHotelId(@Param("hotelId") Long hotelId);

    // 1. Lấy danh sách khách sạn đang hoạt động (deleted = false)
    List<Hotel> findAllByDeletedFalse();

    // 2. Lấy danh sách khách sạn đã bị xóa mềm (deleted = true) -> Để hiện trong thùng rác
    List<Hotel> findAllByDeletedTrue();

    // --- CÁC CHỨC NĂNG MỚI PHỤC VỤ GROUP & GIÁ ---

    // 3. Lấy danh sách theo Group (QUAN TRỌNG: Dùng hàm này ở Service để tính toán làm tròn giá đẹp)
    List<Hotel> findAllByHotelGroupIdAndDeletedFalse(Long groupId);

    // 5. Update giá: Nhân theo tỷ lệ % (Dự phòng)
    // VD: Tăng 10% -> rate = 1.1.
    // Lưu ý: Hàm này chạy SQL trực tiếp nên sẽ ra số lẻ (VD: 1.087.230), không làm tròn đẹp được.
    // Nếu muốn số đẹp, hãy dùng hàm số 3 (findAllByHotelGroupIdAndDeletedFalse) để xử lý bên Java.
    @Modifying
    @Transactional
    @Query("UPDATE Hotel h SET h.hotelPriceFrom = h.hotelPriceFrom * :rate " +
            "WHERE h.hotelGroup.id = :groupId AND h.deleted = false")
    void bulkMultiplyPriceByRate(@Param("groupId") Long groupId, @Param("rate") Double rate);
}