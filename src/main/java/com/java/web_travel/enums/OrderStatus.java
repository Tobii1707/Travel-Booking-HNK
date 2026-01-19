package com.java.web_travel.enums;

public enum OrderStatus {
    PENDING,    // Mới đặt, chờ thanh toán -> TÍNH LÀ ACTIVE
    PAID,       // Đã thanh toán, chờ check-in -> TÍNH LÀ ACTIVE (Quan trọng nhất)
    CONFIRMED,  // Đã xác nhận -> TÍNH LÀ ACTIVE

    COMPLETED,  // Đã trả phòng -> SAFE (Được phép xóa)
    CANCELLED   // Đã hủy -> SAFE (Được phép xóa)
}