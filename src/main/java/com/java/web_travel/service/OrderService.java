package com.java.web_travel.service;

import com.java.web_travel.entity.Order;
import com.java.web_travel.model.request.OrderDTO;
import com.java.web_travel.model.request.OrderFlightDTO;
import com.java.web_travel.model.request.OrderHotelDTO;
import com.java.web_travel.model.response.PageResponse;

public interface OrderService {
    Order addOrder(OrderDTO orderDTO, Long userId);
    Order chooseHotel(Long orderId, Long HotelId, OrderHotelDTO orderHotelDTO);
    Order saveOrder(Order order);
    Order chooseFlight(Long orderId , Long flightId);
    void cancelOrder(Long orderId);
    Order cancelFlight(Long orderId);

    // --- HÀM MỚI THÊM VÀO ---
    Order getOrderById(Long id);
    // ------------------------

    PageResponse getOrdersByUserId(Long userId, int pageNo, int pageSize);
    PageResponse getAllOrders(int pageNo, int pageSize, String sortBy);
    PageResponse getAllOrdersByMultipleColumns(int pageNo, int pageSize, String... sorts);
    PageResponse getAllOrderWithSortByMultipleColumsAndSearch(int pageNo, int pageSize, String search, String sortBy);
    PageResponse advanceSearchByCriteria(int pageNo, int pageSize, String sortBy, String... search);

    Order confirmPayment(Long orderId);
    Order verifyPayment(Long orderId);
    Order payFalled(Long orderId);
    Order chooseFlightWithSeats(Long orderId, OrderFlightDTO orderFlightDTO);
}