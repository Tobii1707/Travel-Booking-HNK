package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_price_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupPriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết với HotelGroup để biết lịch sử của ai
    // Dùng LAZY để khi load history không bị load thừa thông tin Group
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    @JsonIgnore
    private HotelGroup hotelGroup;

    @Column(name = "action_type") // VD: "UPDATE_BASE_PRICE", "ADD_POLICY"
    private String actionType;

    @Column(name = "percentage_change") // Lưu số % tăng/giảm
    private Double percentageChange;

    @Column(columnDefinition = "TEXT") // Cho phép ghi chú dài
    private String description;

    @CreationTimestamp // Tự động lấy giờ hệ thống khi lưu
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}