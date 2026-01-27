package com.java.web_travel.service;

import com.java.web_travel.entity.GroupPriceHistory;
import com.java.web_travel.entity.HotelGroup;
import com.java.web_travel.model.request.HolidayPolicyDTO; // Import đúng DTO của bạn
import com.java.web_travel.model.request.HotelGroupRequest;

import java.util.List;

public interface HotelGroupService {

    // --- CRUD ---
    HotelGroup createGroup(HotelGroupRequest request);
    HotelGroup updateGroup(Long id, HotelGroupRequest request);
    HotelGroup getGroupDetail(Long id);
    List<HotelGroup> getAllActiveGroups();

    // --- XÓA MỀM & RESTORE ---
    void softDeleteGroup(Long id);
    void restoreGroup(Long id);

    // --- LOGIC GIÁ & CHÍNH SÁCH (Đã sửa tham số đầu vào) ---

    // Tạo chính sách ngày lễ (Dùng DTO của bạn)
    void addHolidayPolicy(HolidayPolicyDTO request);

    // Tăng giá gốc toàn bộ
    void bulkUpdateBasePriceForGroup(Long groupId, double percentage);

    // --- BỔ SUNG DÒNG NÀY ---
    List<HotelGroup> getTrashedGroups();

    List<GroupPriceHistory> getPriceHistories(Long groupId);
}