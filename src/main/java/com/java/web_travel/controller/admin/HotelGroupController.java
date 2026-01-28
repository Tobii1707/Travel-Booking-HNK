package com.java.web_travel.controller.admin;

import com.java.web_travel.entity.GroupPriceHistory;
import com.java.web_travel.entity.HotelGroup;
import com.java.web_travel.model.request.HolidayPolicyDTO;
import com.java.web_travel.model.request.HotelGroupRequest;
import com.java.web_travel.service.HotelGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hotel-groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HotelGroupController {

    private final HotelGroupService hotelGroupService;

    // =========================================================================
    //  1. CÁC API CƠ BẢN (CRUD)
    // =========================================================================

    // GET: Lấy danh sách các Group đang hoạt động
    @GetMapping
    public ResponseEntity<List<HotelGroup>> getAllActiveGroups() {
        return ResponseEntity.ok(hotelGroupService.getAllActiveGroups());
    }

    // GET: Xem chi tiết 1 Group
    @GetMapping("/{id}")
    public ResponseEntity<HotelGroup> getGroupDetail(@PathVariable Long id) {
        return ResponseEntity.ok(hotelGroupService.getGroupDetail(id));
    }

    // POST: Tạo mới Group
    @PostMapping
    public ResponseEntity<HotelGroup> createGroup(@RequestBody HotelGroupRequest request) {
        HotelGroup newGroup = hotelGroupService.createGroup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(newGroup);
    }

    // PUT: Cập nhật thông tin Group
    @PutMapping("/{id}")
    public ResponseEntity<HotelGroup> updateGroup(@PathVariable Long id,
                                                  @RequestBody HotelGroupRequest request) {
        return ResponseEntity.ok(hotelGroupService.updateGroup(id, request));
    }

    // =========================================================================
    //  2. API QUẢN LÝ TRẠNG THÁI (XÓA MỀM / KHÔI PHỤC)
    // =========================================================================

    // GET: Thùng rác
    @GetMapping("/trash")
    public ResponseEntity<List<HotelGroup>> getTrashedGroups() {
        return ResponseEntity.ok(hotelGroupService.getTrashedGroups());
    }

    // DELETE: Xóa mềm
    @DeleteMapping("/{id}")
    public ResponseEntity<String> softDeleteGroup(@PathVariable Long id) {
        hotelGroupService.softDeleteGroup(id);
        return ResponseEntity.ok("Đã xóa mềm Tập đoàn và ẩn toàn bộ khách sạn trực thuộc.");
    }

    // PATCH: Khôi phục
    @PatchMapping("/{id}/restore")
    public ResponseEntity<String> restoreGroup(@PathVariable Long id) {
        hotelGroupService.restoreGroup(id);
        return ResponseEntity.ok("Đã khôi phục Tập đoàn và các khách sạn trực thuộc thành công.");
    }

    // =========================================================================
    //  3. API NGHIỆP VỤ NÂNG CAO (GIÁ & CHÍNH SÁCH & LỊCH SỬ)
    // =========================================================================

    // POST: Thêm chính sách ngày lễ mới
    @PostMapping("/policy")
    public ResponseEntity<String> addHolidayPolicy(@RequestBody HolidayPolicyDTO request) {
        hotelGroupService.addHolidayPolicy(request);
        return ResponseEntity.ok("Đã thêm chính sách giá ngày lễ thành công.");
    }

    // [MỚI] PUT: Sửa chính sách ngày lễ
    @PutMapping("/policy/{policyId}")
    public ResponseEntity<String> updateHolidayPolicy(@PathVariable Long policyId,
                                                      @RequestBody HolidayPolicyDTO request) {
        hotelGroupService.updateHolidayPolicy(policyId, request);
        return ResponseEntity.ok("Đã cập nhật chính sách giá thành công.");
    }

    // [MỚI] DELETE: Xóa chính sách ngày lễ
    @DeleteMapping("/policy/{policyId}")
    public ResponseEntity<String> deleteHolidayPolicy(@PathVariable Long policyId) {
        hotelGroupService.deleteHolidayPolicy(policyId);
        return ResponseEntity.ok("Đã xóa bỏ chính sách giá thành công.");
    }

    // PATCH: Tăng/Giảm giá gốc vĩnh viễn (cho toàn bộ khách sạn trong Group)
    @PatchMapping("/{id}/bulk-price")
    public ResponseEntity<String> bulkUpdatePrice(@PathVariable Long id,
                                                  @RequestParam double percentage) {
        hotelGroupService.bulkUpdateBasePriceForGroup(id, percentage);
        return ResponseEntity.ok("Đã cập nhật giá (biến động " + percentage + "%) và lưu lịch sử thành công.");
    }

    // GET: Xem lịch sử thay đổi giá
    @GetMapping("/{id}/history")
    public ResponseEntity<List<GroupPriceHistory>> getPriceHistory(@PathVariable Long id) {
        return ResponseEntity.ok(hotelGroupService.getPriceHistories(id));
    }
}