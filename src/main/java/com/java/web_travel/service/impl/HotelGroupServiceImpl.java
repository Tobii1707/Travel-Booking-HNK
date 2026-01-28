package com.java.web_travel.service.impl;

import com.java.web_travel.entity.GroupPriceHistory;
import com.java.web_travel.entity.HolidayPolicy;
import com.java.web_travel.entity.Hotel;
import com.java.web_travel.entity.HotelGroup;
import com.java.web_travel.model.request.HolidayPolicyDTO;
import com.java.web_travel.model.request.HotelGroupRequest;
import com.java.web_travel.repository.*;
import com.java.web_travel.service.HotelGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class HotelGroupServiceImpl implements HotelGroupService {

    private final HotelGroupRepository hotelGroupRepository;
    private final HotelRepository hotelRepository;
    private final HolidayPolicyRepository holidayPolicyRepository;
    private final HotelBedroomRepository hotelBedroomRepository;
    private final GroupPriceHistoryRepository historyRepository;

    // =========================================================================
    //  1. CÁC HÀM CRUD CƠ BẢN
    // =========================================================================

    @Override
    @Transactional
    public HotelGroup createGroup(HotelGroupRequest request) {
        if (hotelGroupRepository.existsByGroupName(request.getName())) {
            throw new RuntimeException("Tên tập đoàn đã tồn tại");
        }
        HotelGroup group = new HotelGroup();
        group.setGroupName(request.getName());
        group.setDescription(request.getDescription());
        group.setDeleted(false);
        return hotelGroupRepository.save(group);
    }

    @Override
    @Transactional
    public HotelGroup updateGroup(Long id, HotelGroupRequest request) {
        HotelGroup group = hotelGroupRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tập đoàn"));

        String oldGroupName = group.getGroupName();
        String newGroupName = request.getName();

        // 1. Kiểm tra trùng tên
        if (!oldGroupName.equals(newGroupName)
                && hotelGroupRepository.existsByGroupName(newGroupName)) {
            throw new RuntimeException("Tên tập đoàn mới bị trùng");
        }

        // --- [LOGIC MỚI v2] ĐỒNG BỘ TÊN KHÁCH SẠN ---
        if (!oldGroupName.equals(newGroupName)) {
            List<Hotel> hotels = group.getHotels();
            if (hotels != null && !hotels.isEmpty()) {
                String regexOld = "\\s*\\(" + Pattern.quote(oldGroupName) + "\\)\\s*$";

                for (Hotel hotel : hotels) {
                    String currentName = hotel.getHotelName();

                    if (currentName != null) {
                        String cleanName = currentName.replace('\u00A0', ' ').trim();
                        cleanName = cleanName.replaceAll(regexOld, "");
                        hotel.setHotelName(cleanName + " (" + newGroupName + ")");
                    }
                }
                hotelRepository.saveAll(hotels);
            }
        }
        // -----------------------------------------

        group.setGroupName(newGroupName);
        group.setDescription(request.getDescription());
        return hotelGroupRepository.save(group);
    }

    @Override
    public HotelGroup getGroupDetail(Long id) {
        return hotelGroupRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tập đoàn"));
    }

    @Override
    public List<HotelGroup> getAllActiveGroups() {
        return hotelGroupRepository.findAllByDeletedFalse();
    }

    // =========================================================================
    //  2. XÓA MỀM & KHÔI PHỤC (CASCADE)
    // =========================================================================

    @Override
    @Transactional
    public void softDeleteGroup(Long id) {
        HotelGroup group = hotelGroupRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tập đoàn"));

        group.setDeleted(true); // Xóa cha

        // Xóa con (Hotel)
        List<Hotel> hotels = group.getHotels();
        if (hotels != null) {
            for (Hotel hotel : hotels) {
                hotel.setDeleted(true);
            }
        }
        hotelGroupRepository.save(group);
    }

    @Override
    @Transactional
    public void restoreGroup(Long id) {
        HotelGroup group = hotelGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ID tập đoàn"));

        if (!group.isDeleted()) return;

        group.setDeleted(false); // Mở lại cha

        if (group.getHotels() != null) {
            group.getHotels().forEach(hotel -> hotel.setDeleted(false));
        }
        hotelGroupRepository.save(group);
    }

    // =========================================================================
    //  3. LOGIC NÂNG CAO (VALIDATION NGÀY & GIÁ) + LƯU LỊCH SỬ
    // =========================================================================

    @Override
    @Transactional
    public void addHolidayPolicy(HolidayPolicyDTO request) {
        // --- 0. Kiểm tra logic Giá ---
        if (request.getIncreasePercentage() <= -100) {
            throw new RuntimeException("Lỗi: Mức giảm giá không được vượt quá 100%!");
        }

        // --- 1. Kiểm tra ngày ---
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Lỗi: Ngày bắt đầu (" + request.getStartDate() + ") không được ở trong quá khứ!");
        }
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new RuntimeException("Ngày bắt đầu không được lớn hơn ngày kết thúc!");
        }

        // --- 3. Tìm Group ---
        HotelGroup group = hotelGroupRepository.findByIdAndDeletedFalse(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tập đoàn ID: " + request.getGroupId()));

        // --- 4. Kiểm tra trùng lặp ---
        boolean isOverlapped = holidayPolicyRepository.existsOverlappingPolicy(
                request.getGroupId(),
                request.getStartDate(),
                request.getEndDate()
        );

        if (isOverlapped) {
            throw new RuntimeException("Lỗi: Khoảng thời gian bị trùng với một đợt chính sách giá đã tồn tại!");
        }

        // --- 5. Lưu Policy ---
        HolidayPolicy policy = new HolidayPolicy();
        policy.setName(request.getName());
        policy.setStartDate(request.getStartDate());
        policy.setEndDate(request.getEndDate());
        policy.setIncreasePercentage(request.getIncreasePercentage());
        policy.setTargetGroup(group);

        holidayPolicyRepository.save(policy);

        // --- 6. Ghi log lịch sử ---
        String desc = "Thêm chính sách lễ: " + request.getName()
                + " (Từ " + request.getStartDate() + " đến " + request.getEndDate() + ")";
        saveHistory(group, "ADD_HOLIDAY_POLICY", request.getIncreasePercentage(), desc);
    }

    // --- [MỚI] HÀM CẬP NHẬT CHÍNH SÁCH ---
    @Override
    @Transactional
    public void updateHolidayPolicy(Long policyId, HolidayPolicyDTO request) {
        // 1. Tìm chính sách cũ
        HolidayPolicy policy = holidayPolicyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chính sách giá với ID: " + policyId));

        // 2. Validate cơ bản
        if (request.getIncreasePercentage() <= -100) {
            throw new RuntimeException("Lỗi: Mức giảm giá không được vượt quá 100%!");
        }
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new RuntimeException("Lỗi: Ngày bắt đầu không được lớn hơn ngày kết thúc!");
        }

        // 3. Kiểm tra trùng lặp (Dùng hàm loại trừ ID hiện tại)
        // Lưu ý: Lấy Group ID từ policy cũ: policy.getTargetGroup().getId()
        boolean isOverlapped = holidayPolicyRepository.existsOverlappingPolicyExceptId(
                policy.getTargetGroup().getId(),
                request.getStartDate(),
                request.getEndDate(),
                policyId // ID cần loại trừ
        );

        if (isOverlapped) {
            throw new RuntimeException("Lỗi: Thời gian chỉnh sửa bị trùng với một chính sách KHÁC đang tồn tại!");
        }

        // 4. Lưu lại giá trị cũ để log
        String oldName = policy.getName();
        Double oldPercent = policy.getIncreasePercentage();

        // 5. Cập nhật
        policy.setName(request.getName());
        policy.setStartDate(request.getStartDate());
        policy.setEndDate(request.getEndDate());
        policy.setIncreasePercentage(request.getIncreasePercentage());

        holidayPolicyRepository.save(policy);

        // 6. Ghi log
        String desc = "Cập nhật chính sách '" + oldName + "': "
                + "Tên mới '" + request.getName() + "', "
                + "Giá " + oldPercent + "% -> " + request.getIncreasePercentage() + "%, "
                + "Thời gian: " + request.getStartDate() + " đến " + request.getEndDate();

        saveHistory(policy.getTargetGroup(), "UPDATE_HOLIDAY_POLICY", request.getIncreasePercentage(), desc);
    }

    // --- [MỚI] HÀM XÓA CHÍNH SÁCH ---
    @Override
    @Transactional
    public void deleteHolidayPolicy(Long policyId) {
        HolidayPolicy policy = holidayPolicyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chính sách giá để xóa"));

        HotelGroup group = policy.getTargetGroup();
        String policyName = policy.getName();
        Double percent = policy.getIncreasePercentage();
        LocalDate start = policy.getStartDate();
        LocalDate end = policy.getEndDate();

        holidayPolicyRepository.delete(policy);

        String desc = "Đã hủy bỏ/Xóa chính sách: " + policyName
                + " (Vốn áp dụng từ " + start + " đến " + end + ")";

        saveHistory(group, "DELETE_HOLIDAY_POLICY", percent, desc);
    }
    // -----------------------------------------------------------

    @Override
    @Transactional
    public void bulkUpdateBasePriceForGroup(Long groupId, double percentage) {
        // Validation an toàn giá
        if (percentage <= -100) {
            throw new RuntimeException("Lỗi: Không thể giảm giá cơ bản quá 100%!");
        }

        // Tìm Group để lấy thông tin lưu log
        HotelGroup group = hotelGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tập đoàn"));

        // 1. Cập nhật giá hiển thị "Từ..." của khách sạn
        List<Hotel> hotels = hotelRepository.findAllByHotelGroupIdAndDeletedFalse(groupId);
        if (hotels.isEmpty()) {
            throw new RuntimeException("Group này chưa có khách sạn nào!");
        }

        double rate = 1.0 + (percentage / 100.0);

        for (Hotel hotel : hotels) {
            Double oldPrice = hotel.getHotelPriceFrom();
            Double newPrice = smartRoundPrice(oldPrice * rate);

            if (newPrice < 0) newPrice = 0.0;
            hotel.setHotelPriceFrom(newPrice);
        }
        hotelRepository.saveAll(hotels);

        // 2. Cập nhật giá chi tiết từng phòng
        hotelBedroomRepository.updatePriceByGroupId(groupId, percentage);

        // --- 3. Ghi log lịch sử ---
        String action = percentage >= 0 ? "INCREASE_BASE_PRICE" : "DECREASE_BASE_PRICE";
        String desc = percentage >= 0
                ? "Tăng giá cơ bản toàn hệ thống thêm " + percentage + "%"
                : "Giảm giá cơ bản toàn hệ thống đi " + Math.abs(percentage) + "%";

        saveHistory(group, action, percentage, desc);
    }

    @Override
    public List<HotelGroup> getTrashedGroups() {
        return hotelGroupRepository.findAllByDeletedTrue();
    }

    // Hàm tiện ích nội bộ: Làm tròn đẹp
    private Double smartRoundPrice(Double rawPrice) {
        if (rawPrice == null) return 0.0;
        return Math.round(rawPrice / 10000.0) * 10000.0;
    }

    // --- Hàm tiện ích private để lưu lịch sử ---
    private void saveHistory(HotelGroup group, String action, Double percent, String desc) {
        try {
            GroupPriceHistory history = GroupPriceHistory.builder()
                    .hotelGroup(group)         // Set quan hệ với Group
                    .actionType(action)        // Loại hành động
                    .percentageChange(percent) // % thay đổi
                    .description(desc)         // Mô tả chi tiết
                    // createdAt sẽ tự động sinh bởi @CreationTimestamp trong Entity
                    .build();
            historyRepository.save(history);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi lưu lịch sử thay đổi giá");
        }
    }

    @Override
    public List<com.java.web_travel.entity.GroupPriceHistory> getPriceHistories(Long groupId) {
        return historyRepository.findByHotelGroupIdOrderByCreatedAtDesc(groupId);
    }
}