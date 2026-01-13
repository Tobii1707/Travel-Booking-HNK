package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "flight_seats",
        indexes = {
                @Index(name = "idx_flight_seat_flight_id", columnList = "flight_id"),
                @Index(name = "idx_flight_seat_order_id", columnList = "order_id"),
                @Index(name = "idx_flight_seat_is_booked", columnList = "is_booked")
        },
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
    private String seatNumber; // e.g., "1A", "2B", "15C"

    @Column(nullable = false)
    private Boolean isBooked = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    @JsonIgnore
    private Order order;

    @Version
    private Long version; // For optimistic locking to prevent double booking
}
