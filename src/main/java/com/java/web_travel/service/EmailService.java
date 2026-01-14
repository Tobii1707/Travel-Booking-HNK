package com.java.web_travel.service;

import com.java.web_travel.model.request.EmailDTO;

public interface EmailService {

    // Gửi email cơ bản
    String sendEmail(EmailDTO emailDTO);

    // Gửi email thông báo đặt tour (mới tạo)
    Object sendAnnounceEmail(Long orderId);

    // Gửi email thông báo thanh toán thành công
    Object sendAnnouncePaySuccessEmail(Long orderId);

    // Gửi email thông báo thanh toán thất bại
    Object sendAnnouncePayFalledEmail(Long orderId);

    // Gửi email thông báo hủy
    Object sendAnnouceCancel(Long orderId);

    // Gửi email reset mật khẩu
    void sendPasswordResetEmail(String toEmail, String resetLink);
}