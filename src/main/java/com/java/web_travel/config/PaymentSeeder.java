package com.java.web_travel.config;

import com.java.web_travel.entity.Payment;
import com.java.web_travel.enums.PaymentStatus;
import com.java.web_travel.repository.PayRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PaymentSeeder {
    @Autowired
    private PayRepository payRepository;
    public PaymentSeeder(PayRepository payRepository) {

        this.payRepository = payRepository;
    }
    @PostConstruct
    public void paymentSeeder() {
        if (payRepository.count() == 0) {
            Payment payment = new Payment(PaymentStatus.PAID);
            payRepository.save(payment);

            Payment paymentUnPaid = new Payment(PaymentStatus.UNPAID);
            payRepository.save(paymentUnPaid);

            Payment paymentVerifying = new Payment(PaymentStatus.VERIFYING);
            payRepository.save(paymentVerifying);

            Payment paymentFalled = new Payment(PaymentStatus.PAYMENT_FAILED) ;
            payRepository.save(paymentFalled);
        }
    }
}
