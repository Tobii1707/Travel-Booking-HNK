package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.java.web_travel.enums.OrderStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;
import java.util.List;

@Entity
@Table(
        name = "orders",
        indexes = {
                @Index(name = "idx_orders_user_id", columnList = "user_id"),
                @Index(name = "idx_orders_payment_id", columnList = "payment_id"),
                @Index(name = "idx_orders_flight_id", columnList = "flight_id"),
                @Index(name = "idx_orders_hotel_id", columnList = "hotel_id"),
                @Index(name = "idx_orders_destination", columnList = "destination"),
                @Index(name = "idx_orders_order_date", columnList = "order_date")
        }
)
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull
    @Column(name = "destination", nullable = false, length = 255)
    private String destination;

    @NotNull
    @Column(name = "current_location", nullable = false, length = 255)
    private String currentLocation;

    @NotNull
    @Column(name = "number_of_people", nullable = false)
    private int numberOfPeople;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "order_date")
    private Date orderDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "start_hotel")
    @DateTimeFormat
    private Date startHotel;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "end_hotel")
    @DateTimeFormat
    private Date endHotel;

    @Column(name = "total_price", nullable = false)
    private double totalPrice = 0;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties("orders") // User OK
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "payment_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // Payment OK
    private Payment payment;

    // --- SỬA CHỖ NÀY ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "flight_id", nullable = true)
    // 1. Đổi "flightSeats" thành "seats" (cho đúng tên bên Flight.java)
    // 2. Thêm hibernateLazyInitializer, handler để tránh lỗi Proxy
    @JsonIgnoreProperties({"orders", "seats", "hibernateLazyInitializer", "handler"})
    private Flight flight;

    // --- SỬA CHỖ NÀY ---
    @ManyToOne
    @JoinColumn(name = "hotel_id")
    // Thêm hibernateLazyInitializer, handler.
    // Thêm hotelBedrooms để JSON gọn hơn (optional)
    @JsonIgnoreProperties({"orders", "hotelBedrooms", "hibernateLazyInitializer", "handler"})
    private Hotel hotel;

    @Column(name = "bedrooms", length = 2000)
    private String listBedrooms;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("order")
    private List<FlightSeat> flightSeats;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    public Order(String destination, String currentLocation, int numberOfPeople) {
        this.destination = destination;
        this.currentLocation = currentLocation;
        this.numberOfPeople = numberOfPeople;
    }

    @Column(name = "list_seats")
    private String listSeats;
}