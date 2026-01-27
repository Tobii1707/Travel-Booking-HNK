package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore; // <--- 1. NHỚ IMPORT CÁI NÀY
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(
        name = "hotel_booking",
        indexes = {
                @Index(name = "idx_hb_order_id", columnList = "order_id"),
                @Index(name = "idx_hb_hotel_bedroom_dates", columnList = "hotel_id, hotel_bedroom_id, start_date, end_date")
        }
)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class HotelBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- SỬA TẠI ĐÂY ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore  // <--- 2. THÊM DÒNG NÀY ĐỂ NGẮT VÒNG LẶP
    private Order order;

    // -------------------

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_id", nullable = false)
    // Nếu khi xem Order bạn KHÔNG cần xem chi tiết Hotel thì thêm @JsonIgnore luôn để tránh lỗi ByteBuddy
    // Nếu cần xem thì phải dùng DTO hoặc cấu hình Hibernate module.
    // Tạm thời cứ để nguyên, nếu lỗi tiếp thì thêm @JsonIgnore vào đây.
    private Hotel hotel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_bedroom_id", nullable = false)
    private HotelBedroom hotelBedroom;

    @Temporal(TemporalType.DATE)
    @Column(name = "start_date", nullable = false)
    private Date startDate;

    @Temporal(TemporalType.DATE)
    @Column(name = "end_date", nullable = false)
    private Date endDate;
}