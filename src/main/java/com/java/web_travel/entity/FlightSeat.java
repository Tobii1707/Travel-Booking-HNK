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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_id", nullable = false)
    @JsonIgnore
    private Flight flight;

    @Column(nullable = false, length = 10)
    private String seatNumber;

    @Column(name = "price", nullable = false)
    private double price;

    @Column(name = "is_booked", nullable = false)
    @JsonProperty("isBooked")
    private boolean isBooked = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    @JsonIgnore
    private Order order;

    @Version
    private Long version;

    @JsonProperty("order")
    public OrderInfo getOrderInfo() {
        if (order == null) {
            return null;
        }
        return new OrderInfo(order.getId());
    }

    @Data
    @AllArgsConstructor
    public static class OrderInfo {
        private Long id;
    }
}