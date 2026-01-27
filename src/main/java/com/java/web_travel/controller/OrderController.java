package com.java.web_travel.controller;

import com.java.web_travel.entity.Order;
import com.java.web_travel.model.request.OrderDTO;
import com.java.web_travel.model.request.OrderHotelDTO;
import com.java.web_travel.model.request.OrderFlightDTO;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.model.response.PageResponse;
import com.java.web_travel.service.OrderService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // Tạo đơn hàng mới
    @PostMapping("/create/{id}")
    public ApiResponse<Order> addOrder(@Valid @RequestBody OrderDTO orderDTO, @PathVariable Long id) {
        log.info("Bắt đầu tạo đơn hàng cho user id = {}", id);
        ApiResponse<Order> apiResponse = new ApiResponse<>();
        apiResponse.setData(orderService.addOrder(orderDTO, id));
        log.info("Tạo đơn hàng thành công cho user id = {}", id);
        return apiResponse;
    }

    // Chọn khách sạn
    @PostMapping("/chooseHotel/{orderId}/{hotelId}")
    public ApiResponse<String> chooseHotel(
            @PathVariable Long orderId,
            @PathVariable Long hotelId,
            @RequestBody OrderHotelDTO orderHotelDTO) {
        log.info("Bắt đầu chọn khách sạn cho đơn hàng id = {}", orderId);
        try {
            ApiResponse<String> apiResponse = new ApiResponse<>();
            orderService.chooseHotel(orderId, hotelId, orderHotelDTO);

            // Trả về chuỗi thông báo thay vì Object Order để tránh lỗi dữ liệu đệ quy
            apiResponse.setData("Đặt phòng thành công!");
            apiResponse.setCode(1000);
            apiResponse.setMessage("success");

            log.info("Chọn khách sạn thành công cho đơn hàng id = {}", orderId);
            return apiResponse;
        } catch (Exception e) {
            log.error("Lỗi khi chọn khách sạn: {}", e.getMessage());
            // Trả về mã lỗi 7777 để Frontend hiện thông báo thay vì lỗi 500
            return new ApiResponse<>(7777, e.getMessage(), null);
        }
    }

    // --- [SỬA QUAN TRỌNG 1]: Thêm Try-Catch cho hàm chọn chuyến bay (cách cũ) ---
    @PostMapping("/chooseFlight/{idOrder}/{idFlight}")
    public ApiResponse<Order> chooseFlight(@PathVariable Long idOrder, @PathVariable Long idFlight) {
        log.info("Bắt đầu chọn chuyến bay cho đơn hàng id = {}", idOrder);
        try {
            ApiResponse<Order> apiResponse = new ApiResponse<>();
            Order order = orderService.chooseFlight(idOrder, idFlight);
            apiResponse.setData(order);
            apiResponse.setCode(1000);
            apiResponse.setMessage("success");
            log.info("Chọn chuyến bay thành công cho đơn hàng id = {}", idOrder);
            return apiResponse;
        } catch (Exception e) {
            // Đây là nơi bắt lỗi 500 trước kia
            log.error("Lỗi khi chọn chuyến bay: {}", e.getMessage());
            return new ApiResponse<>(7777, "Lỗi chọn chuyến bay: " + e.getMessage(), null);
        }
    }

    // --- [SỬA QUAN TRỌNG 2]: Hàm chọn ghế máy bay ---
    @PostMapping("/chooseFlightWithSeats/{orderId}/{flightId}")
    public ApiResponse<Order> chooseFlightWithSeats(
            @PathVariable Long orderId,
            @PathVariable Long flightId,
            @RequestBody OrderFlightDTO orderFlightDTO) {

        log.info("Bắt đầu chọn ghế cho đơn id = {} và chuyến bay id = {}", orderId, flightId);
        try {
            ApiResponse<Order> apiResponse = new ApiResponse<>();

            // Đảm bảo ID chuyến bay được gán đúng
            orderFlightDTO.setFlightId(flightId);

            Order order = orderService.chooseFlightWithSeats(orderId, orderFlightDTO);

            apiResponse.setData(order);
            apiResponse.setCode(1000);
            apiResponse.setMessage("Đặt vé và chọn ghế thành công");
            log.info("Xử lý thành công cho đơn id = {}", orderId);
            return apiResponse;
        } catch (Exception e) {
            // Nếu Service báo lỗi (ví dụ ghế đã có người đặt), nó sẽ nhảy vào đây
            log.error("Lỗi khi đặt ghế: {}", e.getMessage());
            return new ApiResponse<>(7777, e.getMessage(), null);
        }
    }

    // Hủy đơn hàng
    @DeleteMapping("/{id}")
    public ApiResponse<Order> deleteOrder(@PathVariable Long id) {
        log.info("Bắt đầu hủy đơn hàng id = {}", id);
        ApiResponse<Order> apiResponse = new ApiResponse<>();
        try {
            orderService.cancelOrder(id);
            apiResponse.setMessage("Hủy đơn thành công");
            log.info("Đã hủy đơn hàng id = {}", id);
            return apiResponse;
        } catch (Exception e) {
            log.error("Lỗi hủy đơn: {}", e.getMessage());
            return new ApiResponse<>(7777, e.getMessage(), null);
        }
    }

    // Hủy chuyến bay trong đơn
    @PutMapping("/cancelFlight/{id}")
    public ApiResponse<Order> cancelFlight(@PathVariable Long id) {
        log.info("Bắt đầu hủy chuyến bay trong đơn id = {}", id);
        try {
            ApiResponse<Order> apiResponse = new ApiResponse<>();
            Order order = orderService.cancelFlight(id);
            apiResponse.setData(order);
            apiResponse.setMessage("Hủy chuyến bay thành công");
            return apiResponse;
        } catch (Exception e) {
            log.error("Lỗi hủy chuyến bay: {}", e.getMessage());
            return new ApiResponse<>(7777, e.getMessage(), null);
        }
    }

    // Lấy chi tiết 1 đơn hàng
    @GetMapping("/single/{id}")
    public ApiResponse<Order> getSingleOrder(@PathVariable Long id) {
        log.info("Lấy chi tiết đơn hàng id = {}", id);
        try {
            Order order = orderService.getOrderById(id);
            return new ApiResponse<>(1000, "Lấy dữ liệu thành công", order);
        } catch (Exception e) {
            log.error("Lỗi lấy đơn hàng: {}", e.getMessage());
            return new ApiResponse<>(7777, "Không tìm thấy đơn hàng", null);
        }
    }

    // Các API lấy danh sách (Giữ nguyên logic, thêm try-catch bao quanh)
    @GetMapping("/{id}")
    public ApiResponse<PageResponse> getOrderById(@PathVariable Long id,
                                                  @RequestParam(defaultValue = "0", required = false) int pageNo,
                                                  @RequestParam(defaultValue = "5", required = false) int pageSize) {
        try {
            PageResponse<?> orders = orderService.getOrdersByUserId(id, pageNo, pageSize);
            return new ApiResponse<>(1000, "Lấy danh sách thành công", orders);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return new ApiResponse<>(7777, e.getMessage(), null);
        }
    }

    @GetMapping("/getAllOrder")
    public ApiResponse<PageResponse> getAllOrder(@RequestParam(defaultValue = "0", required = false) int pageNo,
                                                 @RequestParam(defaultValue = "5", required = false) int pageSize,
                                                 @RequestParam(required = false) String sortBy) {
        try {
            PageResponse<?> orders = orderService.getAllOrders(pageNo, pageSize, sortBy);
            return new ApiResponse<>(1000, "Lấy danh sách thành công", orders);
        } catch (Exception e) {
            return new ApiResponse<>(7777, e.getMessage(), null);
        }
    }

    // ... (Các API tìm kiếm nâng cao giữ nguyên logic nhưng nhớ thêm try-catch tương tự như trên)

    @PostMapping("/{orderId}/confirm-payment")
    public ApiResponse<Order> confirmOrder(@PathVariable Long orderId) {
        ApiResponse<Order> apiResponse = new ApiResponse<>();
        try {
            apiResponse.setData(orderService.confirmPayment(orderId));
            apiResponse.setMessage("Xác nhận thanh toán thành công");
            return apiResponse;
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiResponse<>(7777, e.getMessage(), null);
        }
    }

    @PostMapping("/{orderId}/verifying-payment")
    public ApiResponse<Order> verifyOrder(@PathVariable Long orderId) {
        ApiResponse<Order> apiResponse = new ApiResponse<>();
        try {
            apiResponse.setData(orderService.verifyPayment(orderId));
            apiResponse.setMessage("Xác thực thanh toán thành công");
            return apiResponse;
        } catch (Exception e) {
            return new ApiResponse<>(7777, e.getMessage(), null);
        }
    }

    @PostMapping("/{orderId}/payment-falled")
    public ApiResponse<Order> paymentFalledOrder(@PathVariable Long orderId) {
        ApiResponse<Order> apiResponse = new ApiResponse<>();
        try {
            apiResponse.setData(orderService.payFalled(orderId));
            apiResponse.setMessage("Ghi nhận thanh toán thất bại");
            return apiResponse;
        } catch (Exception e) {
            return new ApiResponse<>(7777, e.getMessage(), null);
        }
    }
}