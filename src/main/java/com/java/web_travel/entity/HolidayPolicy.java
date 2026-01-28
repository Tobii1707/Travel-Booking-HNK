package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // Import thêm
import jakarta.persistence.*;
import lombok.Getter;       // Dùng cái này thay @Data
import lombok.Setter;       // Dùng cái này thay @Data
import lombok.NoArgsConstructor; // Nên thêm
import lombok.AllArgsConstructor; // Nên thêm
import java.time.LocalDate;

@Entity
@Getter // An toàn hơn @Data cho Entity có quan hệ 2 chiều
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "holiday_policy")
public class HolidayPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double increasePercentage;

    // Policy này áp dụng cho nhóm nào?
    @ManyToOne(fetch = FetchType.EAGER) // Có thể để EAGER để load luôn Group nếu cần (tùy chọn)
    @JoinColumn(name = "group_id")
    @JsonIgnoreProperties("holidayPolicies") // Ngắt vòng lặp từ phía con trỏ về cha
    private HotelGroup targetGroup; // Tên biến này phải trùng với mappedBy bên HotelGroup
}