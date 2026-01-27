package com.java.web_travel.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "holiday_policy")
public class HolidayPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // VD: Tết 2025
    private LocalDate startDate;
    private LocalDate endDate;
    private Double increasePercentage; // VD: 20.0 (tăng 20%)

    // Policy này áp dụng cho nhóm nào?
    @ManyToOne
    @JoinColumn(name = "group_id")
    private HotelGroup targetGroup;
}