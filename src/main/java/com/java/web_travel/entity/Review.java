package com.java.web_travel.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Liên kết với Order của bạn
    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @Column(name = "flight_rating", nullable = false)
    private Integer flightRating;

    @Column(name = "hotel_rating", nullable = false)
    private Integer hotelRating;

    @Column(name = "website_rating", nullable = false)
    private Integer websiteRating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt;
}