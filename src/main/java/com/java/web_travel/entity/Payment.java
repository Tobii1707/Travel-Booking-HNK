package com.java.web_travel.entity;

import com.java.web_travel.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "payment",
        indexes = { @Index(name = "idx_payment_status", columnList = "status") }
)
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;

    public Payment(PaymentStatus status) {
        this.status = status;
    }
}