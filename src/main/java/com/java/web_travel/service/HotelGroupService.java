package com.java.web_travel.service;

import com.java.web_travel.entity.GroupPriceHistory;
import com.java.web_travel.entity.HotelGroup;
import com.java.web_travel.model.request.HolidayPolicyDTO;
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
    List<HotelGroup> getTrashedGroups(); // Lấy danh sách thùng rác

    // --- LOGIC GIÁ & CHÍNH SÁCH ---

    // 1. Thêm mới chính sách lễ (Dùng DTO của bạn)
    void addHolidayPolicy(HolidayPolicyDTO request);

    // 2. [MỚI] Cập nhật chính sách (Sửa lỗi sai sót, đổi ngày, đổi %...)
    void updateHolidayPolicy(Long policyId, HolidayPolicyDTO request);

    // 3. [MỚI] Xóa chính sách (Hủy bỏ đợt tăng giá)
    void deleteHolidayPolicy(Long policyId);

    // 4. Tăng/Giảm giá gốc toàn bộ theo %
    void bulkUpdateBasePriceForGroup(Long groupId, double percentage);

    // --- LỊCH SỬ THAY ĐỔI GIÁ ---
    List<GroupPriceHistory> getPriceHistories(Long groupId);
}