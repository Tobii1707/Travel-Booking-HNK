package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty; // <--- Import cái này
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "flight_seats",
        // ... giữ nguyên phần index ...
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"flight_id", "seat_number"})
        })
public class FlightSeat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_id", nullable = false)
    @JsonIgnore
    private Flight flight;

    @Column(nullable = false, length = 10)
    private String seatNumber;

    // --- SỬA PHẦN NÀY ---
    @Column(name = "is_booked", nullable = false)
    @JsonProperty("isBooked") // <--- Bắt buộc JSON trả về tên là "isBooked"
    private boolean isBooked = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    @JsonIgnore // Giữ nguyên cái này để tránh lỗi vòng lặp
    private Order order;

    @Version
    private Long version;

    // --- THÊM HÀM NÀY ĐỂ LẤY ORDER ID ---
    @JsonProperty("order") // Trả về object nhỏ chỉ chứa ID cho Frontend dùng
    public OrderInfo getOrderInfo() {
        if (order == null) return null;
        return new OrderInfo(order.getId());
    }

    // Hoặc đơn giản hơn chỉ lấy ID:
    // @JsonProperty("orderId")
    // public Long getOrderId() { return order != null ? order.getId() : null; }

    // Class phụ để trả về cấu trúc giống Frontend mong đợi (seat.order.id)
    @Data
    @AllArgsConstructor
    public static class OrderInfo {
        private Long id;
    }
}