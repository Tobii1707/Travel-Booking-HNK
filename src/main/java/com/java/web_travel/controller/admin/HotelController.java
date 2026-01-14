package com.java.web_travel.controller.admin;

import com.java.web_travel.entity.Hotel;
import com.java.web_travel.entity.Order;
import com.java.web_travel.model.request.HotelDTO;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.repository.OrderRepository;
import com.java.web_travel.service.HotelService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @Slf4j: Tự động tạo biến 'log' để ghi nhật ký hoạt động.
 */
@Slf4j

@RestController
@RequestMapping("/admin")

public class HotelController {

    @Autowired
    private HotelService hotelService;

    @Autowired
    private OrderRepository orderRepository;

    // --- 1. API TẠO KHÁCH SẠN MỚI ---
    @PostMapping("/createHotel")
    public ApiResponse<Hotel> createHotel(@Valid @RequestBody HotelDTO hotelDTO) {
        // @Valid: Kiểm tra dữ liệu đầu vào (VD: giá tiền không được âm).
        // @RequestBody: Hứng cục JSON từ Frontend ép vào object HotelDTO.

        log.info("Create hotelDTO: {}", hotelDTO); // Ghi log dữ liệu nhận được

        ApiResponse<Hotel> apiResponse = new ApiResponse<>();

        // Gọi Service tạo khách sạn và gán kết quả vào response
        apiResponse.setData(hotelService.createHotel(hotelDTO));

        log.info("Created hotel successfully: {}", apiResponse.getData()); // Ghi log thành công
        return apiResponse;
    }

    // --- 2. API LẤY DANH SÁCH TẤT CẢ KHÁCH SẠN ---
    @GetMapping("/getAllHotels")
    public ApiResponse<List<Hotel>> getAllHotels() {
        log.info(("Get all hotels "));

        ApiResponse<List<Hotel>> apiResponse = new ApiResponse<>();

        // Gọi Service lấy toàn bộ danh sách
        apiResponse.setData(hotelService.getAllHotels());
        apiResponse.setMessage("Success");

        log.info("Get all hotels successfully: {}", apiResponse.getData());
        return apiResponse;
    }

    // --- 3. API GỢI Ý KHÁCH SẠN THEO ĐỊA ĐIỂM ĐƠN HÀNG ---
    // Logic: Khách đặt vé máy bay đi Hà Nội (orderId=10) -> Hệ thống tự gợi ý các khách sạn ở Hà Nội.
    @GetMapping("/hotel-in-destination")
    public ApiResponse<List<Hotel>> getHotelInDestination(@RequestParam Long orderId) {
        // @RequestParam: Lấy tham số sau dấu ? trên URL (query param).

        // Bước 1: Tìm đơn hàng xem khách đi đâu.
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new RuntimeException("Order not found")); // Nếu không thấy đơn hàng thì báo lỗi

        // Bước 2: Lấy địa điểm đến (Destination) từ đơn hàng.
        String destination = order.getDestination();

        // Bước 3: Tìm các khách sạn ở địa điểm đó.
        ApiResponse<List<Hotel>> apiResponse = new ApiResponse<>();
        apiResponse.setData(hotelService.getHotelsByDestination(destination));
        apiResponse.setMessage("Success");

        log.info("Get hotels successfully: {}", apiResponse.getData());
        return apiResponse;
    }

    // --- 4. API CẬP NHẬT KHÁCH SẠN ---
    @PutMapping("/updateHotel/{id}")
    public ApiResponse<Hotel> updateHotel(@Valid @RequestBody HotelDTO hotelDTO, @PathVariable Long id) {
        // @PathVariable: Lấy ID từ trên đường dẫn URL ({id}) gán vào biến Long id.

        log.info("Update hotelDTO id =  : {}", id);

        ApiResponse<Hotel> apiResponse = new ApiResponse<>();

        // Gọi Service cập nhật
        apiResponse.setData(hotelService.updateHotel(hotelDTO, id));

        log.info("Update hotel successfully id = : {}", id);
        return apiResponse;
    }

    // --- 5. API XÓA KHÁCH SẠN ---
    @DeleteMapping("/{id}")
    public ApiResponse<Hotel> deleteHotel(@PathVariable Long id) {
        log.info("Delete hotel id =  : {}", id);

        ApiResponse<Hotel> apiResponse = new ApiResponse<>();

        // Gọi Service xóa
        hotelService.deleteHotel(id);

        apiResponse.setMessage("Delete Success");
        log.info("Delete hotel successfully id = : {}", id);
        return apiResponse;
    }
}