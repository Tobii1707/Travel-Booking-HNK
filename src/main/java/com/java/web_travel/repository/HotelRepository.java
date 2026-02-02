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

    // --- CÁC CHỨC NĂNG CŨ (GIỮ NGUYÊN KHÔNG ĐỤNG CHẠM) ---

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
    @Modifying
    @Transactional
    @Query("UPDATE Hotel h SET h.hotelPriceFrom = h.hotelPriceFrom * :rate " +
            "WHERE h.hotelGroup.id = :groupId AND h.deleted = false")
    void bulkMultiplyPriceByRate(@Param("groupId") Long groupId, @Param("rate") Double rate);

    // =========================================================================
    //  [MỚI] TÌM KIẾM ĐA NĂNG (TÊN + ĐỊA ĐIỂM/ĐỊA CHỈ + GROUP)
    // =========================================================================
    /**
     * Tìm kiếm tổng hợp:
     * 1. LEFT JOIN hotelGroup: Để tìm được cả trong tên nhóm (và không bỏ sót KS chưa có nhóm).
     * 2. LOWER + CONCAT: Tìm gần đúng không phân biệt hoa thường.
     * 3. Tìm trong: Tên KS, Địa điểm, Địa chỉ, Tên Nhóm.
     */
    @Query("SELECT h FROM Hotel h LEFT JOIN h.hotelGroup g WHERE " +
            "h.deleted = false AND " +
            "(:keyword IS NULL OR :keyword = '' OR " +
            " LOWER(h.hotelName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            " LOWER(h.address) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            " LOWER(g.groupName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Hotel> searchByKeyword(@Param("keyword") String keyword);
}