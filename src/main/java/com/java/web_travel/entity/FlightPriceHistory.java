package com.java.web_travel.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Entity
@Table(name = "flight_price_history")
@Getter
@Setter
public class FlightPriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "flight_id", nullable = false)
    private Flight flight;

    private double oldPrice;

    private double newPrice;

    @Column(name = "changed_at")
    private Date changedAt;

    // Có thể thêm cột changedBy nếu hệ thống của bạn có quản lý user/admin đăng nhập
    // private String changedBy;
}