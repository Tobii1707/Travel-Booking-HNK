package com.java.web_travel.service;

import com.java.web_travel.model.request.AssignGroupRequest;
import com.java.web_travel.model.request.BulkUpdatePriceRequest;
import com.java.web_travel.model.request.HotelDTO;
import com.java.web_travel.model.response.HotelResponse;

import java.time.LocalDate;
import java.util.List;

public interface HotelService {

    // --- CÁC HÀM CƠ BẢN (CRUD) ---
    HotelResponse createHotel(HotelDTO hotelDTO);

    HotelResponse getHotel(Long hotelId);

    // Hàm này sẽ chỉ lấy các khách sạn chưa xóa (deleted = false)
    List<HotelResponse> getAllHotels();

    HotelResponse updateHotel(HotelDTO hotelDTO, Long hotelId);

    // Hàm này xóa mềm (đổi deleted thành true) hoặc xóa cứng nếu force=true
    void deleteHotel(Long hotelId, boolean force);

    List<HotelResponse> getHotelsByDestination(String destination);

    // --- CÁC HÀM QUẢN LÝ THÙNG RÁC (BẠN ĐÃ CÓ) ---

    // 1. Lấy danh sách khách sạn trong thùng rác (đã xóa)
    List<HotelResponse> getDeletedHotels();

    // 2. Khôi phục khách sạn từ thùng rác
    void restoreHotel(Long hotelId);

    // --- CÁC HÀM MỚI (LOGIC GROUP & GIÁ - VỪA VIẾT Ở IMPL) ---

    // 3. Thêm nhiều khách sạn vào 1 nhóm (kèm đổi tên tự động)
    void addHotelsToGroup(AssignGroupRequest request);

    // 4. Tăng giá vĩnh viễn (Theo % và làm tròn số đẹp)
    void bulkUpdatePricePermanent(BulkUpdatePriceRequest request);

    // 5. Tính giá động (Giá gốc + Phụ thu ngày lễ nếu có) - Dùng khi khách đặt phòng
    Double calculateDynamicPrice(Long hotelId, LocalDate dateToCheck);
}