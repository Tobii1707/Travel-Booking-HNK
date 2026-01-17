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

    @PostMapping("/create/{id}") // id này là của user
    public ApiResponse<Order> addOrder(@Valid  @RequestBody OrderDTO orderDTO, @PathVariable Long id) {
        log.info("Start add order of user id = {}",id);
        ApiResponse<Order> apiResponse = new ApiResponse<>();
        apiResponse.setData(orderService.addOrder(orderDTO,id));
        log.info("Add order successfully of user id = {}",id);
        return apiResponse;
    }

    @PostMapping("/chooseHotel/{orderId}/{hotelId}") // id này là của id order dto
    public ApiResponse<Order> chooseHotel(
            @PathVariable Long orderId,
            @PathVariable Long hotelId,
            @RequestBody OrderHotelDTO orderHotelDTO) {
        log.info("Start choose hotel of user id = {}",orderId);

        ApiResponse<Order> apiResponse = new ApiResponse<>();

        Order order = orderService.chooseHotel(orderId, hotelId, orderHotelDTO);
        orderService.saveOrder(order);

        apiResponse.setData(order);
        apiResponse.setMessage("success");
        log.info("Choose hotel successfully of user id = {}",orderId);
        return apiResponse;
    }

    @PostMapping("/chooseFlight/{idOrder}/{idFlight}")
    public ApiResponse<Order> chooseFlight(@PathVariable Long idOrder, @PathVariable Long idFlight) {
        log.info("Start choose flight of user id = {}",idOrder);
        ApiResponse<Order> apiResponse = new ApiResponse<>();
        Order order = orderService.chooseFlight(idOrder,idFlight);
        apiResponse.setData(order);
        apiResponse.setMessage("success");
        log.info("Choose flight successfully of user id = {}",idOrder);
        return apiResponse;
    }

    // --- ĐÂY LÀ ĐOẠN ĐÃ SỬA ĐỂ KHỚP VỚI URL .../3/1 ---
    @PostMapping("/chooseFlightWithSeats/{orderId}/{flightId}")
    public ApiResponse<Order> chooseFlightWithSeats(
            @PathVariable Long orderId,
            @PathVariable Long flightId, // Thêm tham số này để hứng số 1 từ URL
            @RequestBody OrderFlightDTO orderFlightDTO) {

        log.info("Start choose flight with seats for order id = {} and flight id = {}", orderId, flightId);
        ApiResponse<Order> apiResponse = new ApiResponse<>();

        // Gán flightId từ URL vào DTO để Service biết chọn chuyến nào
        orderFlightDTO.setFlightId(flightId);

        // Gọi service xử lý
        Order order = orderService.chooseFlightWithSeats(orderId, orderFlightDTO);

        apiResponse.setData(order);
        apiResponse.setMessage("Choose flight with seats success");
        log.info("Choose flight with seats successfully for order id = {}", orderId);
        return apiResponse;
    }
    // ----------------------------------------------------

    // hủy cả chuyến
    @DeleteMapping("/{id}")
    public ApiResponse<Order> deleteOrder(@PathVariable Long id) {
        log.info("Start delete order of user id = {}",id);
        ApiResponse<Order> apiResponse = new ApiResponse<>();
        orderService.cancelOrder(id);
        apiResponse.setMessage("cancel success");
        log.info("Delete order successfully of user id = {}",id);
        return apiResponse;
    }

    // hủy máy bay
    @PutMapping("/cancelFlight/{id}")
    public ApiResponse<Order> cancelFlight(@PathVariable Long id) {
        log.info("Start cancel flight of user id = {}",id);
        ApiResponse<Order> apiResponse = new ApiResponse<>();
        Order order = orderService.cancelFlight(id);
        apiResponse.setData(order);
        apiResponse.setMessage("cancel success");
        log.info("Cancel flight successfully of user id = {}",id);
        return apiResponse;
    }

    @GetMapping("/single/{id}")
    public ApiResponse<Order> getSingleOrder(@PathVariable Long id) {
        log.info("Start get single order details, orderId = {}", id);
        try {
            Order order = orderService.getOrderById(id);
            return new ApiResponse<>(1000, "Get single order success", order);
        } catch (Exception e) {
            log.error("Error getting single order: {}", e.getMessage());
            return new ApiResponse<>(7777, e.getMessage(), null);
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<PageResponse> getOrderById(@PathVariable Long id,
                                                  @RequestParam(defaultValue = "0",required = false) int pageNo,
                                                  @RequestParam(defaultValue = "5",required = false) int pageSize) {
        log.info("Start get order of user id = {}",id);
        try{
            PageResponse<?> orders = orderService.getOrdersByUserId(id,pageNo,pageSize);
            return new ApiResponse<>(1000,"get order by id success " , orders) ;
        }catch (Exception e){
            log.error(e.getMessage(),e);
            return new ApiResponse<>(7777,e.getMessage(),null);
        }
    }

    @GetMapping("/getAllOrder")
    public ApiResponse<PageResponse> getAllOrder(@RequestParam(defaultValue = "0",required = false) int pageNo,
                                                 @RequestParam(defaultValue = "5",required = false) int pageSize,
                                                 @RequestParam(required = false) String sortBy) {
        log.info("Start get order : {}",pageNo);
        try{
            PageResponse<?> orders = orderService.getAllOrders(pageNo,pageSize,sortBy)  ;
            return new ApiResponse<>(1000,"get success",orders);
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiResponse<>(7777,e.getMessage(),null);
        }
    }

    @GetMapping("/getAllOrderWithMultipleColumns")
    public ApiResponse<PageResponse> getAllOrderWithSortByMultipleColums(@RequestParam(defaultValue = "0",required = false) int pageNo,
                                                                         @RequestParam(defaultValue = "5",required = false) int pageSize,
                                                                         @RequestParam(required = false) String... sort) {
        log.info("Start get order with sort by multiple columns : ");
        try{
            PageResponse<?> orders = orderService.getAllOrdersByMultipleColumns(pageNo,pageSize,sort)  ;
            return new ApiResponse<>(1000,"get success",orders);
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiResponse<>(7777,e.getMessage(),null);
        }
    }

    @GetMapping("/getAllOrderWithMultipleColumnsWithSearch")
    public ApiResponse<PageResponse> getAllOrderWithSortByMultipleColumsAndSearch(@RequestParam(defaultValue = "0",required = false) int pageNo,
                                                                                  @RequestParam(defaultValue = "5",required = false) int pageSize,
                                                                                  @RequestParam( required = false) String search,
                                                                                  @RequestParam(required = false) String sortBy) {
        log.info("Start get order with sort by  columns and search : ");
        try{
            PageResponse<?> orders = orderService.getAllOrderWithSortByMultipleColumsAndSearch(pageNo,pageSize,search,sortBy)  ;
            return new ApiResponse<>(1000,"get success",orders);
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiResponse<>(7777,e.getMessage(),null);
        }
    }

    @GetMapping("/advance-search-by-criteria")
    public ApiResponse<PageResponse> advanceSearchByCriteria(@RequestParam(defaultValue = "0",required = false) int pageNo,
                                                             @RequestParam(defaultValue = "5",required = false) int pageSize,
                                                             @RequestParam( required = false) String sortBy,
                                                             @RequestParam(required = false) String... search) {
        log.info("Start search by criteria : ");
        try{
            PageResponse<?> orders = orderService.advanceSearchByCriteria(pageNo,pageSize,sortBy,search)  ;
            return new ApiResponse<>(1000,"get success",orders);
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiResponse<>(7777,e.getMessage(),null);
        }
    }

    @PostMapping("/{orderId}/confirm-payment")
    public ApiResponse<Order> confirmOrder(@PathVariable Long orderId){
        ApiResponse apiResponse = new ApiResponse<>();
        log.info("Start confirm payment order : {} ",orderId);
        try{
            apiResponse.setData(orderService.confirmPayment(orderId));
            apiResponse.setMessage("confirm payment success");
            return apiResponse;
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiResponse<>(7777,e.getMessage(),null);
        }
    }

    @PostMapping("/{orderId}/verifying-payment")
    public ApiResponse<Order> verifyOrder(@PathVariable Long orderId){
        ApiResponse apiResponse = new ApiResponse<>();
        try {
            apiResponse.setData(orderService.verifyPayment(orderId));
            apiResponse.setMessage("verify payment success");
            return apiResponse;
        }catch (Exception e) {
            log.error(e.getMessage());
            return new ApiResponse<>(7777,e.getMessage(),null);
        }
    }

    @PostMapping("/{orderId}/payment-falled")
    public ApiResponse<Order> paymentFalledOrder(@PathVariable Long orderId){
        ApiResponse apiResponse = new ApiResponse<>();
        try {
            apiResponse.setData(orderService.payFalled(orderId));
            apiResponse.setMessage("pay falled ");
            return apiResponse;
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiResponse<>(7777,e.getMessage(),null);
        }
    }
}