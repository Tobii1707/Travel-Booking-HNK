package com.java.web_travel.service.impl;

import com.java.web_travel.entity.Order;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.EmailDTO;
import com.java.web_travel.repository.OrderRepository;
import com.java.web_travel.service.EmailService; // Import Interface vừa tạo
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private OrderRepository orderRepository;

    @Override
    public String sendEmail(EmailDTO emailDTO) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8"); // Thêm UTF-8 để tránh lỗi font
            helper.setFrom("hanamkhanh2004@gmail.com");
            helper.setTo(emailDTO.getToEmail());
            helper.setSubject(emailDTO.getSubject());
            helper.setText(emailDTO.getBody(), true);
            mailSender.send(mimeMessage);
            return "Email Sent";
        } catch (Exception e) {
            log.error("Error sending email: {}", e.getMessage());
            return "Lỗi khi gửi email";
        }
    }

    @Override
    public Object sendAnnounceEmail(Long orderId) {
        Order order = getOrderById(orderId);
        EmailDTO emailDTO = new EmailDTO();

        emailDTO.setToEmail(order.getUser().getEmail());
        String subject = "Cảm ơn quý ông/bà " + order.getUser().getFullName() + " đã đặt chuyến đi của FUTURE WONDER";
        emailDTO.setSubject(subject);

        String orderDetails = generateOrderInfoHtml(order);
        String body = orderDetails +
                "<i>Vui lòng sớm thanh toán để có một chuyến đi tuyệt vời.</i><br>" +
                "<b>FUTURE WONDER TRÂN TRỌNG CẢM ƠN!</b>";

        emailDTO.setBody(body);
        return sendEmail(emailDTO);
    }

    @Override
    public Object sendAnnouncePaySuccessEmail(Long orderId) {
        Order order = getOrderById(orderId);
        EmailDTO emailDTO = new EmailDTO();

        emailDTO.setToEmail(order.getUser().getEmail());
        emailDTO.setSubject("THANH TOÁN CHUYẾN ĐI THÀNH CÔNG");

        String orderDetails = generateOrderInfoHtml(order);
        String body = "------------------<b>XÁC NHẬN THANH TOÁN THÀNH CÔNG</b>------------------<br>" +
                orderDetails +
                "<b>FUTURE WONDER TRÂN TRỌNG CẢM ƠN!</b>";

        emailDTO.setBody(body);
        return sendEmail(emailDTO);
    }

    @Override
    public Object sendAnnouncePayFalledEmail(Long orderId) {
        Order order = getOrderById(orderId);
        EmailDTO emailDTO = new EmailDTO();

        emailDTO.setToEmail(order.getUser().getEmail());
        emailDTO.setSubject("THANH TOÁN CHUYẾN ĐI THẤT BẠI");

        String orderDetails = generateOrderInfoHtml(order);
        String body = "------------------<b>THANH TOÁN THẤT BẠI</b>------------------<br>" +
                "---------------<b>FUTURE WONDER rất tiếc khi phải thông báo rằng bạn đã thanh toán không thành công, vui lòng kiểm tra lại</b><br>" +
                orderDetails +
                "<b>FUTURE WONDER TRÂN TRỌNG CẢM ƠN!</b>";

        emailDTO.setBody(body);
        return sendEmail(emailDTO);
    }

    @Override
    public Object sendAnnouceCancel(Long orderId) {
        Order order = getOrderById(orderId);
        EmailDTO emailDTO = new EmailDTO();

        emailDTO.setToEmail(order.getUser().getEmail());
        emailDTO.setSubject("HỦY CHUYẾN THÀNH CÔNG");

        String orderDetails = generateOrderInfoHtml(order);
        String body = "------------------<b>HỦY CHUYẾN THÀNH CÔNG</b>------------------<br>" +
                "---------------<b>FUTURE WONDER rất tiếc khi không thể đồng hành cùng bạn trong chuyến đi lần này!</b><br>" +
                "Hẹn quý khách trong một tương lai gần nhất<br>" +
                orderDetails +
                "<b>FUTURE WONDER TRÂN TRỌNG CẢM ƠN!</b>";

        emailDTO.setBody(body);
        return sendEmail(emailDTO);
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        EmailDTO emailDTO = new EmailDTO();
        emailDTO.setToEmail(toEmail);
        emailDTO.setSubject("Yêu cầu đặt lại mật khẩu - FUTURE WONDER");

        String body = "<h3>Xin chào,</h3>" +
                "<p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Future Wonder của mình.</p>" +
                "<p>Vui lòng nhấp vào liên kết bên dưới để đổi mật khẩu:</p>" +
                "<p><a href=\"" + resetLink + "\">BẤM VÀO ĐÂY ĐỂ ĐẶT LẠI MẬT KHẨU</a></p>" +
                "<br>" +
                "<p>Link này sẽ hết hạn sau 1 giờ.</p>" +
                "<p>Nếu bạn không yêu cầu thay đổi này, vui lòng bỏ qua email này.</p>" +
                "<br>" +
                "<b>FUTURE WONDER TEAM</b>";

        emailDTO.setBody(body);
        sendEmail(emailDTO);
    }

    // --- PRIVATE HELPER METHODS (Để tránh lặp code) ---

    private Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    private String formatDate(Date date) {
        if (date == null) return "";
        LocalDate localDate = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        return localDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    /**
     * Hàm này tạo đoạn HTML thông tin chi tiết chuyến đi dùng chung cho cả 4 loại email
     */
    private String generateOrderInfoHtml(Order order) {
        String userName = order.getUser().getFullName();
        String destination = order.getDestination();
        int numberOfPeople = order.getNumberOfPeople();
        String dateCheckIn = formatDate(order.getCheckinDate());
        String dateCheckOut = formatDate(order.getCheckoutDate());
        String hotelName = order.getHotel() != null ? order.getHotel().getHotelName() : "N/A";
        String flightName = order.getFlight() != null ? order.getFlight().getAirlineName() : "N/A";
        String flightClass = order.getFlight() != null ? order.getFlight().getTicketClass().toString() : "";
        String totalPrice = String.valueOf(order.getTotalPrice());

        return "---------<b>Thông Tin Chi Tiết Chuyến Đi</b>--------- <br>" +
                "<b>Người đặt:</b> " + userName + "<br>" +
                "<b>Địa điểm:</b> " + destination + "<br>" +
                "<b>Số người:</b> " + numberOfPeople + "<br>" +
                "<b>Thời gian check-in:</b> " + dateCheckIn + "<br>" +
                "<b>Thời gian check-out:</b> " + dateCheckOut + "<br>" +
                "<b>Tên hãng bay:</b> " + flightName + " - Hạng: " + flightClass + "<br>" +
                "<b>Tên khách sạn:</b> " + hotelName + "<br>" +
                "<b>Tổng Chi Phí:</b> " + totalPrice + "<br><br>";
    }
}