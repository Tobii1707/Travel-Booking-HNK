package com.java.web_travel.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_change_history")
@Data
public class PriceChangeHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;

    private Double oldPrice;
    private Double newPrice;
    private Double percentage; // % tăng/giảm tại thời điểm đó

    private LocalDateTime changeDate;

    private String description; // Ví dụ: "Tăng giá toàn bộ Group", "Sửa thủ công"

    @PrePersist
    public void prePersist() {
        if (changeDate == null) changeDate = LocalDateTime.now();
    }
}