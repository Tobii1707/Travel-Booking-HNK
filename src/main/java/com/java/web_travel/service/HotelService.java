package com.java.web_travel.service;

import com.java.web_travel.model.request.AddPolicyToHotelsRequest;
import com.java.web_travel.model.request.AssignGroupRequest;
import com.java.web_travel.model.request.BulkUpdatePriceByListRequest;
import com.java.web_travel.model.request.BulkUpdatePriceRequest;
import com.java.web_travel.model.request.HotelDTO;
import com.java.web_travel.model.request.UpdatePolicyListHotelRequest;
import com.java.web_travel.model.response.HolidayPolicyResponse;
import com.java.web_travel.model.response.HotelHistoryResponse;
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

    // 1. Dùng để GỢI Ý KHÁCH SẠN tương ứng với địa điểm trong Order
    // (Chỉ tìm chính xác theo địa danh/address)
    List<HotelResponse> getHotelsByDestination(String destination);

    // 2. Dùng cho THANH TÌM KIẾM (Search Bar) của Admin
    // (Tìm đa năng: Tên KS hoặc Địa chỉ hoặc Tên Group)
    List<HotelResponse> searchHotels(String keyword);

    // --- CÁC HÀM QUẢN LÝ THÙNG RÁC ---
    List<HotelResponse> getDeletedHotels();

    void restoreHotel(Long hotelId);

    // --- CÁC HÀM QUẢN LÝ GROUP & GIÁ ---
    void addHotelsToGroup(AssignGroupRequest request);

    void bulkUpdatePricePermanent(BulkUpdatePriceRequest request);

    void bulkUpdatePriceByListIds(BulkUpdatePriceByListRequest request);

    Double calculateDynamicPrice(Long hotelId, LocalDate dateToCheck);

    // --- CHỨC NĂNG MỚI (Thêm chính sách cho list KS tùy chọn) ---
    void addPolicyToSelectedHotels(AddPolicyToHotelsRequest request);

    // [THÊM MỚI] Xem lịch sử policy của KHÁCH SẠN LẺ
    List<HotelHistoryResponse> getPolicyHistoryByHotel(Long hotelId);

    // --- [MỚI] QUẢN LÝ SỬA/XÓA CHÍNH SÁCH ---
    void updateHolidayPolicy(Long policyId, UpdatePolicyListHotelRequest request);

    void deleteHolidayPolicy(Long policyId);

}