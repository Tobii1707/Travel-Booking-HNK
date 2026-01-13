package com.java.web_travel.repository;

import com.java.web_travel.entity.Payment;
import com.java.web_travel.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayRepository extends JpaRepository<Payment,Long> {

    Optional<Payment> findByStatus(PaymentStatus status);

    List<Payment> findAllByStatus(PaymentStatus status);

    long countByStatus(PaymentStatus status);
}
