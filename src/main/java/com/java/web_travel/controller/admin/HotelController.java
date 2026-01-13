package com.java.web_travel.controller.admin;

import com.java.web_travel.entity.Hotel;
import com.java.web_travel.entity.Order;
import com.java.web_travel.model.request.HotelDTO;
import com.java.web_travel.model.response.ApiReponse;
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
    public ApiReponse<Hotel> createHotel(@Valid @RequestBody HotelDTO hotelDTO) {
        // @Valid: Kiểm tra dữ liệu đầu vào (VD: giá tiền không được âm).
        // @RequestBody: Hứng cục JSON từ Frontend ép vào object HotelDTO.

        log.info("Create hotelDTO: {}", hotelDTO); // Ghi log dữ liệu nhận được

        ApiReponse<Hotel> apiReponse = new ApiReponse<>();

        // Gọi Service tạo khách sạn và gán kết quả vào response
        apiReponse.setData(hotelService.createHotel(hotelDTO));

        log.info("Created hotel successfully: {}", apiReponse.getData()); // Ghi log thành công
        return apiReponse;
    }

    // --- 2. API LẤY DANH SÁCH TẤT CẢ KHÁCH SẠN ---
    @GetMapping("/getAllHotels")
    public ApiReponse<List<Hotel>> getAllHotels() {
        log.info(("Get all hotels "));

        ApiReponse<List<Hotel>> apiReponse = new ApiReponse<>();

        // Gọi Service lấy toàn bộ danh sách
        apiReponse.setData(hotelService.getAllHotels());
        apiReponse.setMessage("Success");

        log.info("Get all hotels successfully: {}", apiReponse.getData());
        return apiReponse;
    }

    // --- 3. API GỢI Ý KHÁCH SẠN THEO ĐỊA ĐIỂM ĐƠN HÀNG ---
    // Logic: Khách đặt vé máy bay đi Hà Nội (orderId=10) -> Hệ thống tự gợi ý các khách sạn ở Hà Nội.
    @GetMapping("/hotel-in-destination")
    public ApiReponse<List<Hotel>> getHotelInDestination(@RequestParam Long orderId) {
        // @RequestParam: Lấy tham số sau dấu ? trên URL (query param).

        // Bước 1: Tìm đơn hàng xem khách đi đâu.
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new RuntimeException("Order not found")); // Nếu không thấy đơn hàng thì báo lỗi

        // Bước 2: Lấy địa điểm đến (Destination) từ đơn hàng.
        String destination = order.getDestination();

        // Bước 3: Tìm các khách sạn ở địa điểm đó.
        ApiReponse<List<Hotel>> apiReponse = new ApiReponse<>();
        apiReponse.setData(hotelService.getHotelsByDestination(destination));
        apiReponse.setMessage("Success");

        log.info("Get hotels successfully: {}", apiReponse.getData());
        return apiReponse;
    }

    // --- 4. API CẬP NHẬT KHÁCH SẠN ---
    @PutMapping("/updateHotel/{id}")
    public  ApiReponse<Hotel> updateHotel(@Valid @RequestBody HotelDTO hotelDTO, @PathVariable Long id) {
        // @PathVariable: Lấy ID từ trên đường dẫn URL ({id}) gán vào biến Long id.

        log.info("Update hotelDTO id =  : {}", id);

        ApiReponse<Hotel> apiReponse = new ApiReponse<>();

        // Gọi Service cập nhật
        apiReponse.setData(hotelService.updateHotel(hotelDTO, id));

        log.info("Update hotel successfully id = : {}", id);
        return apiReponse;
    }

    // --- 5. API XÓA KHÁCH SẠN ---
    @DeleteMapping("/{id}")
    public ApiReponse<Hotel> deleteHotel(@PathVariable Long id) {
        log.info("Delete hotel id =  : {}", id);

        ApiReponse<Hotel> apiReponse = new ApiReponse<>();

        // Gọi Service xóa
        hotelService.deleteHotel(id);

        apiReponse.setMessage("Delete Success");
        log.info("Delete hotel successfully id = : {}", id);
        return apiReponse;
    }
}