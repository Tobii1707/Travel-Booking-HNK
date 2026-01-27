package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "flight_seats",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"flight_id", "seat_number"})
        }
)
public class FlightSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- QUAN TRỌNG: Ngắt vòng lặp với Flight ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_id", nullable = false)
    @JsonIgnore
    private Flight flight;

    @Column(nullable = false, length = 10)
    private String seatNumber;

    @Column(name = "price", nullable = false)
    private double price;

    // --- QUAN TRỌNG: Đảm bảo tên JSON là "isBooked" ---
    @Column(name = "is_booked", nullable = false)
    @JsonProperty("isBooked")
    private boolean isBooked = false;

    // --- QUAN TRỌNG NHẤT: Ngắt vòng lặp chết người (Lỗi 500) với Order ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    @JsonIgnore
    private Order order;

    @Version
    private Long version;

    // =================================================================
    // KỸ THUẬT "CẦU NỐI":
    // Giúp Frontend vẫn lấy được order.id dù đã dùng @JsonIgnore ở trên
    // =================================================================

    @JsonProperty("order") // Tên field trong JSON trả về sẽ là "order"
    public OrderInfo getOrderInfo() {
        if (order == null) {
            return null;
        }
        return new OrderInfo(order.getId());
    }

    // Class con (DTO nội bộ) để chứa ID
    @Data
    @AllArgsConstructor
    public static class OrderInfo {
        private Long id;
    }
}