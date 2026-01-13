package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(
        name = "hotel_bedroom",
        indexes = {
                @Index(name = "idx_bedroom_hotel_id", columnList = "hotel_id"),
                @Index(name = "idx_bedroom_room_number", columnList = "room_number")
        }
)
@Entity
public class HotelBedroom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", nullable = false)
    private Long roomNumber;

    @Column(name = "price", nullable = false)
    private Double price;

    @Column(name = "room_type", nullable = false, length = 100)
    private String roomType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_id", nullable = false)
    @JsonIgnore
    private Hotel hotel;
}

