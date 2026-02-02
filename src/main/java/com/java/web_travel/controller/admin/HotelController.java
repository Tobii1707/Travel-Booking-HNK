package com.java.web_travel.controller.admin;

import com.java.web_travel.entity.Order;
import com.java.web_travel.model.request.AssignGroupRequest;
import com.java.web_travel.model.request.BulkUpdatePriceByListRequest; // [MỚI] Import Request DTO
import com.java.web_travel.model.request.BulkUpdatePriceRequest;
import com.java.web_travel.model.request.HotelDTO;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.model.response.HotelResponse;
import com.java.web_travel.repository.HotelBedroomRepository;
import com.java.web_travel.repository.OrderRepository;
import com.java.web_travel.service.HotelBedroomService;
import com.java.web_travel.service.HotelService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/admin")
public class HotelController {

    @Autowired
    private HotelService hotelService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private HotelBedroomRepository hotelBedroomRepository;

    @Autowired
    private HotelBedroomService hotelBedroomService;

    // --- 1. API TẠO KHÁCH SẠN MỚI ---
    @PostMapping("/createHotel")
    public ApiResponse<HotelResponse> createHotel(@Valid @RequestBody HotelDTO hotelDTO) {
        log.info("Create hotelDTO: {}", hotelDTO);
        ApiResponse<HotelResponse> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.createHotel(hotelDTO));
        apiResponse.setMessage("Tạo khách sạn thành công");
        return apiResponse;
    }

    // --- 2. API LẤY CHI TIẾT ---
    @GetMapping("/{id}")
    public ApiResponse<HotelResponse> getHotelDetail(@PathVariable Long id) {
        log.info("Get hotel detail id: {}", id);
        ApiResponse<HotelResponse> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.getHotel(id));
        apiResponse.setMessage("Lấy thông tin thành công");
        return apiResponse;
    }

    // --- 3. API LẤY TẤT CẢ ---
    @GetMapping("/getAllHotels")
    public ApiResponse<List<HotelResponse>> getAllHotels() {
        log.info("Get all active hotels");
        ApiResponse<List<HotelResponse>> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.getAllHotels());
        apiResponse.setMessage("Success");
        return apiResponse;
    }

    // =========================================================================
    //  PHÂN BIỆT 2 LOẠI TÌM KIẾM
    // =========================================================================

    // --- 4. API GỢI Ý KHÁCH SẠN THEO ORDER (Logic Cũ - Chính xác) ---
    @GetMapping("/hotel-in-destination")
    public ApiResponse<List<HotelResponse>> getHotelInDestination(@RequestParam Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new RuntimeException("Order not found"));

        ApiResponse<List<HotelResponse>> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.getHotelsByDestination(order.getDestination()));
        apiResponse.setMessage("Success");
        return apiResponse;
    }

    // --- 4.1. [MỚI] API TÌM KIẾM ĐA NĂNG (Logic Mới - Thông minh) ---
    @GetMapping("/search")
    public ApiResponse<List<HotelResponse>> searchHotels(@RequestParam String keyword) {
        log.info("Searching hotels with keyword: {}", keyword);
        ApiResponse<List<HotelResponse>> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.searchHotels(keyword));
        apiResponse.setMessage("Tìm thấy kết quả");
        return apiResponse;
    }

    // =========================================================================

    // --- 5. API CẬP NHẬT ---
    @PutMapping("/updateHotel/{id}")
    public ApiResponse<HotelResponse> updateHotel(@Valid @RequestBody HotelDTO hotelDTO, @PathVariable Long id) {
        log.info("Update hotel id: {}", id);
        ApiResponse<HotelResponse> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.updateHotel(hotelDTO, id));
        apiResponse.setMessage("Cập nhật thành công");
        return apiResponse;
    }

    // --- 6. API XÓA KHÁCH SẠN ---
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteHotel(@PathVariable Long id, @RequestParam(defaultValue = "false") boolean force) {
        log.info("Request delete hotel id: {}, force: {}", id, force);
        try {
            hotelService.deleteHotel(id, force);
            ApiResponse<String> apiResponse = new ApiResponse<>();
            apiResponse.setMessage(force ? "Đã xóa cưỡng chế!" : "Xóa thành công (Thùng rác)");
            return apiResponse;
        } catch (RuntimeException e) {
            log.error("Error deleting hotel: {}", e.getMessage());
            ApiResponse<String> apiResponse = new ApiResponse<>();
            apiResponse.setCode(9999);
            apiResponse.setMessage(e.getMessage());
            return apiResponse;
        }
    }

    // --- 7. API THÙNG RÁC ---
    @GetMapping("/trash")
    public ApiResponse<List<HotelResponse>> getTrashCan() {
        log.info("Get deleted hotels");
        ApiResponse<List<HotelResponse>> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.getDeletedHotels());
        apiResponse.setMessage("Lấy danh sách thùng rác thành công");
        return apiResponse;
    }

    // --- 8. API KHÔI PHỤC ---
    @PutMapping("/restore/{id}")
    public ApiResponse<String> restoreHotel(@PathVariable Long id) {
        log.info("Restore hotel id: {}", id);
        hotelService.restoreHotel(id);
        ApiResponse<String> apiResponse = new ApiResponse<>();
        apiResponse.setMessage("Khôi phục khách sạn thành công!");
        return apiResponse;
    }

    // --- 9. API LẤY PHÒNG ---
    @GetMapping("/get-rooms/{hotelId}")
    public ApiResponse<List<com.java.web_travel.entity.HotelBedroom>> getRoomsByHotel(
            @PathVariable Long hotelId,
            @RequestParam(required = false) String checkInDate
    ) {
        LocalDate date = null;
        if (checkInDate != null && !checkInDate.isEmpty()) {
            try {
                date = LocalDate.parse(checkInDate, DateTimeFormatter.ISO_DATE);
            } catch (Exception e) {
                log.error("Lỗi format ngày: {}", e.getMessage());
                date = LocalDate.now();
            }
        } else {
            date = LocalDate.now();
        }

        List<com.java.web_travel.entity.HotelBedroom> rooms = hotelBedroomService.getRoomsByHotel(hotelId, date);

        ApiResponse<List<com.java.web_travel.entity.HotelBedroom>> apiResponse = new ApiResponse<>();
        apiResponse.setData(rooms);
        apiResponse.setMessage("Lấy danh sách phòng thành công");
        return apiResponse;
    }

    // --- 10. API GÁN NHÓM ---
    @PostMapping("/assign-group")
    public ApiResponse<String> assignGroup(@RequestBody AssignGroupRequest request) {
        hotelService.addHotelsToGroup(request);
        ApiResponse<String> apiResponse = new ApiResponse<>();
        apiResponse.setMessage("Đã thêm vào nhóm thành công!");
        return apiResponse;
    }

    // --- 11. API TĂNG GIÁ (THEO GROUP) ---
    @PostMapping("/bulk-update-price")
    public ApiResponse<String> bulkUpdatePrice(@RequestBody BulkUpdatePriceRequest request) {
        hotelService.bulkUpdatePricePermanent(request);
        ApiResponse<String> apiResponse = new ApiResponse<>();
        apiResponse.setMessage("Đã cập nhật giá Group thành công!");
        return apiResponse;
    }

    // --- 12. [MỚI] API TĂNG GIÁ (THEO DANH SÁCH CHỌN) ---
    @PostMapping("/bulk-update-price-list")
    public ApiResponse<String> bulkUpdatePriceByList(@RequestBody BulkUpdatePriceByListRequest request) {
        hotelService.bulkUpdatePriceByListIds(request);
        ApiResponse<String> apiResponse = new ApiResponse<>();
        apiResponse.setMessage("Cập nhật giá thành công cho " + request.getHotelIds().size() + " khách sạn!");
        return apiResponse;
    }
}