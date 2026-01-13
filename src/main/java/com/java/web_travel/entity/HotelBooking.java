package com.java.web_travel.entity;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_id", nullable = false)
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
