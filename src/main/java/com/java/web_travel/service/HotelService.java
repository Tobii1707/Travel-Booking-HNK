package com.java.web_travel.service;

import com.java.web_travel.model.request.HotelDTO;
import com.java.web_travel.model.response.HotelResponse;
import java.util.List;

public interface HotelService {

    HotelResponse createHotel(HotelDTO hotelDTO);

    HotelResponse getHotel(Long hotelId);

    // Hàm này sẽ chỉ lấy các khách sạn chưa xóa (deleted = false)
    List<HotelResponse> getAllHotels();

    HotelResponse updateHotel(HotelDTO hotelDTO, Long hotelId);

    // Hàm này sẽ đổi thành Xóa mềm (đổi deleted thành true)
    void deleteHotel(Long hotelId, boolean force);

    List<HotelResponse> getHotelsByDestination(String destination);

    // --- BẠN CẦN THÊM 2 HÀM NÀY ---

    // 1. Lấy danh sách khách sạn trong thùng rác (đã xóa)
    List<HotelResponse> getDeletedHotels();

    // 2. Khôi phục khách sạn từ thùng rác
    void restoreHotel(Long hotelId);
}