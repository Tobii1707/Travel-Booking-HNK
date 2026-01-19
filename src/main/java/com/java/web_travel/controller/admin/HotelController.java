package com.java.web_travel.controller.admin;

import com.java.web_travel.entity.Order;
import com.java.web_travel.model.request.HotelDTO;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.model.response.HotelResponse;
import com.java.web_travel.repository.HotelBedroomRepository;
import com.java.web_travel.repository.OrderRepository;
import com.java.web_travel.service.HotelService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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

    // --- 1. API TẠO KHÁCH SẠN MỚI ---
    @PostMapping("/createHotel")
    public ApiResponse<HotelResponse> createHotel(@Valid @RequestBody HotelDTO hotelDTO) {
        log.info("Create hotelDTO: {}", hotelDTO);
        ApiResponse<HotelResponse> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.createHotel(hotelDTO));
        apiResponse.setMessage("Tạo khách sạn thành công");
        return apiResponse;
    }

    // --- 2. API LẤY DANH SÁCH KHÁCH SẠN (ĐANG HOẠT ĐỘNG) ---
    @GetMapping("/getAllHotels")
    public ApiResponse<List<HotelResponse>> getAllHotels() {
        log.info("Get all active hotels");
        ApiResponse<List<HotelResponse>> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.getAllHotels());
        apiResponse.setMessage("Success");
        return apiResponse;
    }

    // --- 3. API GỢI Ý KHÁCH SẠN THEO ĐỊA ĐIỂM ĐƠN HÀNG ---
    @GetMapping("/hotel-in-destination")
    public ApiResponse<List<HotelResponse>> getHotelInDestination(@RequestParam Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new RuntimeException("Order not found"));

        ApiResponse<List<HotelResponse>> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.getHotelsByDestination(order.getDestination()));
        apiResponse.setMessage("Success");
        return apiResponse;
    }

    // --- 4. API CẬP NHẬT KHÁCH SẠN ---
    @PutMapping("/updateHotel/{id}")
    public ApiResponse<HotelResponse> updateHotel(@Valid @RequestBody HotelDTO hotelDTO, @PathVariable Long id) {
        log.info("Update hotel id: {}", id);
        ApiResponse<HotelResponse> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.updateHotel(hotelDTO, id));
        apiResponse.setMessage("Cập nhật thành công");
        return apiResponse;
    }

    // --- 5. API XÓA KHÁCH SẠN (ĐÃ SỬA LỖI Ở ĐÂY) ---
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteHotel(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean force // 1. Thêm tham số nhận từ URL
    ) {
        log.info("Request delete hotel id: {}, force: {}", id, force);

        try {
            // 2. Truyền đủ 2 tham số vào Service (id và force)
            hotelService.deleteHotel(id, force);

            ApiResponse<String> apiResponse = new ApiResponse<>();
            // Thông báo khác nhau tùy theo việc có force hay không
            apiResponse.setMessage(force
                    ? "Đã xóa cưỡng chế và hủy các đơn hàng liên quan!"
                    : "Xóa thành công (Đã chuyển vào thùng rác)");
            return apiResponse;

        } catch (RuntimeException e) {
            // Bắt lỗi logic
            log.error("Error deleting hotel: {}", e.getMessage());
            ApiResponse<String> apiResponse = new ApiResponse<>();
            apiResponse.setCode(9999);
            apiResponse.setMessage(e.getMessage());
            return apiResponse;
        }
    }

    // --- 6. API LẤY DANH SÁCH THÙNG RÁC ---
    @GetMapping("/trash")
    public ApiResponse<List<HotelResponse>> getTrashCan() {
        log.info("Get deleted hotels (Trash Can)");

        ApiResponse<List<HotelResponse>> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.getDeletedHotels());
        apiResponse.setMessage("Lấy danh sách thùng rác thành công");

        return apiResponse;
    }

    // --- 7. API KHÔI PHỤC KHÁCH SẠN ---
    @PutMapping("/restore/{id}")
    public ApiResponse<String> restoreHotel(@PathVariable Long id) {
        log.info("Restore hotel id: {}", id);

        hotelService.restoreHotel(id);

        ApiResponse<String> apiResponse = new ApiResponse<>();
        apiResponse.setMessage("Khôi phục khách sạn thành công!");

        return apiResponse;
    }

    @GetMapping("/get-rooms/{hotelId}")
    public ApiResponse<List<com.java.web_travel.entity.HotelBedroom>> getRoomsByHotel(@PathVariable Long hotelId) {
        log.info("Get rooms for hotel id: {}", hotelId);

        // Tìm các phòng thuộc khách sạn này
        // Lưu ý: Đảm bảo trong HotelBedroomRepository có hàm findByHotel_Id(Long hotelId)
        // Nếu chưa có, hãy xem chú thích bên dưới
        List<com.java.web_travel.entity.HotelBedroom> rooms = hotelBedroomRepository.findByHotelId(hotelId);

        ApiResponse<List<com.java.web_travel.entity.HotelBedroom>> apiResponse = new ApiResponse<>();
        apiResponse.setData(rooms);
        apiResponse.setMessage("Lấy danh sách phòng thành công");

        return apiResponse;
    }
}