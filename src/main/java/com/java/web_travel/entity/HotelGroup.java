package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // <--- Import cái này
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Entity
@Getter // Dùng Getter thay vì @Data
@Setter // Dùng Setter thay vì @Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "hotel_group")
public class HotelGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String groupName;

    private String description;

    @Column(name = "is_deleted", columnDefinition = "boolean default false")
    private boolean deleted = false;

    // --- ĐOẠN CẦN SỬA ---
    @OneToMany(mappedBy = "hotelGroup", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnoreProperties("hotelGroup") // <--- THÊM DÒNG NÀY: Cắt đứt vòng lặp chiều ngược lại
    private List<Hotel> hotels;

    // --- MỚI (THÊM ĐOẠN NÀY VÀO) ---
    // mappedBy = "targetGroup" phải trùng tên biến trong HolidayPolicy
    @OneToMany(mappedBy = "targetGroup", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    // Ngắt vòng lặp JSON: Khi lấy list policy, không cho policy in lại group nữa
    @JsonIgnoreProperties("targetGroup")
    private List<HolidayPolicy> holidayPolicies;
}