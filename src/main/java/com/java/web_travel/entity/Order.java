package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // Nhớ import dòng này
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
    @Column(name = "number_of_people", nullable = false)
    private int numberOfPeople;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "order_date")
    private Date orderDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "check_in_date")
    @DateTimeFormat
    private Date checkinDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "check_out_date")
    @DateTimeFormat
    private Date checkoutDate;

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
    @JsonIgnoreProperties("orders") // Tránh lấy ngược lại danh sách order của User
    private User user;

    @ManyToOne
    @JoinColumn(name = "payment_id")
    private Payment payment;

    // --- SỬA QUAN TRỌNG: FLIGHT ---
    @ManyToOne(fetch = FetchType.EAGER) // Bắt buộc tải thông tin chuyến bay ngay lập tức
    @JoinColumn(name = "flight_id", nullable = true)
    // Khi lấy Flight, đừng lấy danh sách orders bên trong Flight nữa để tránh vòng lặp
    @JsonIgnoreProperties({"orders", "flightSeats"})
    private Flight flight;

    @ManyToOne
    @JoinColumn(name = "hotel_id")
    @JsonIgnoreProperties("orders")
    private Hotel hotel;

    @Column(name = "bedrooms", length = 2000)
    private String listBedrooms;

    // --- SỬA QUAN TRỌNG: FLIGHT SEATS ---
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER) // Bắt buộc tải ghế ngay
    // Khi lấy ghế, đừng lấy ngược lại thông tin Order để tránh vòng lặp
    @JsonIgnoreProperties("order")
    private List<FlightSeat> flightSeats;

    public Order(String destination, int numberOfPeople, Date checkinDate, Date checkoutDate) {
        this.destination = destination;
        this.numberOfPeople = numberOfPeople;
        this.checkinDate = checkinDate;
        this.checkoutDate = checkoutDate;
    }
}