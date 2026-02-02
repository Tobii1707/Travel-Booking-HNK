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

    List<HotelResponse> getAllHotels();

    HotelResponse updateHotel(HotelDTO hotelDTO, Long hotelId);

    void deleteHotel(Long hotelId, boolean force);

    // =========================================================================
    //  PHÂN BIỆT RÕ 2 CHỨC NĂNG TÌM KIẾM
    // =========================================================================

    // 1. Dùng để GỢI Ý KHÁCH SẠN tương ứng với địa điểm trong Order
    // (Chỉ tìm chính xác theo địa danh/address)
    List<HotelResponse> getHotelsByDestination(String destination);

    // 2. Dùng cho THANH TÌM KIẾM (Search Bar) của Admin
    // (Tìm đa năng: Tên KS hoặc Địa chỉ hoặc Tên Group)
    List<HotelResponse> searchHotels(String keyword);

    // =========================================================================

    // --- CÁC HÀM QUẢN LÝ THÙNG RÁC ---
    List<HotelResponse> getDeletedHotels();

    void restoreHotel(Long hotelId);

    // --- CÁC HÀM QUẢN LÝ GROUP & GIÁ ---
    void addHotelsToGroup(AssignGroupRequest request);

    void bulkUpdatePricePermanent(BulkUpdatePriceRequest request);

    Double calculateDynamicPrice(Long hotelId, LocalDate dateToCheck);
}