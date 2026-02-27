package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(
        name = "hotels",
        indexes = {
                @Index(name = "idx_hotels_name", columnList = "hotel_name"),
                @Index(name = "idx_hotels_address", columnList = "address")
        }
)
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Hotel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "hotel_name", nullable = false, length = 255)
    private String hotelName;

    @Column(name = "hotel_price", nullable = false)
    private double hotelPriceFrom;

    @Column(name = "address", nullable = false, length = 500)
    private String address;

    @Column(name = "number_floor", nullable = false)
    private int numberFloor;

    @OneToMany(mappedBy = "hotel", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("hotel")
    private List<HotelBedroom> hotelBedrooms;

    @OneToMany(mappedBy = "hotel", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Order> orders;

    public Hotel(String hotelName, double hotelPrice) {
        this.hotelName = hotelName;
        this.hotelPriceFrom = hotelPrice;
    }

    @Column(name = "number_room_per_floor")
    private Integer numberRoomPerFloor;

    @Column(name = "is_deleted", columnDefinition = "boolean default false")
    private boolean deleted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    @JsonIgnoreProperties({"hotels", "hibernateLazyInitializer", "handler"})
    private HotelGroup hotelGroup;

}