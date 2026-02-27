package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // Import thêm cái này
import com.java.web_travel.enums.TicketClass;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;
import java.util.List;

@Entity
@Table(
        name = "flight",
        indexes = {
                @Index(name = "idx_flight_check_in", columnList = "check_in_date"),
                @Index(name = "idx_flight_check_out", columnList = "check_out_date"),
                @Index(name = "idx_flight_ticket_class", columnList = "ticket_class"),

                @Index(name = "idx_flight_airline", columnList = "airline_id"),

                @Index(name = "idx_flight_departure", columnList = "departure_location"),
                @Index(name = "idx_flight_arrival", columnList = "arrival_location")
        }
)
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "airline_id", nullable = false)
    @JsonIgnoreProperties("flights")
    private Airline airline;

    @Column(name = "airplane_name", length = 100)
    private String airplaneName;

    @Column(name = "departure_location", nullable = false, length = 100)
    private String departureLocation;

    @Column(name = "arrival_location", nullable = false, length = 100)
    private String arrivalLocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_class", nullable = false, length = 30)
    private TicketClass ticketClass;

    @Column(name = "price", nullable = false)
    private double price;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "check_in_date", nullable = false)
    @DateTimeFormat
    private Date checkInDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "check_out_date", nullable = false)
    @DateTimeFormat
    private Date checkOutDate;

    @Column(name = "number_of_chairs", nullable = false)
    private int numberOfChairs;

    @Column(name = "seats_available", nullable = false)
    private int seatAvailable;

    @Version
    @JsonIgnore
    private Long version;

    @OneToMany(mappedBy = "flight", cascade = CascadeType.PERSIST)
    @JsonIgnore
    private List<Order> orders;

    @OneToMany(mappedBy = "flight", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<FlightSeat> seats;

    @Column(name = "is_deleted")
    private boolean deleted = false;
}