package com.java.web_travel.service.impl;

import com.java.web_travel.entity.PasswordResetToken;
import com.java.web_travel.entity.User;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.ResetPasswordDTO;
import com.java.web_travel.repository.PasswordResetTokenRepository;
import com.java.web_travel.repository.UserRepository;
import com.java.web_travel.service.EmailService; // Import Interface
import com.java.web_travel.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor // Sử dụng Constructor Injection thay cho @Autowired field
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final int EXPIRATION_HOURS = 1;

    // Các dependency được khai báo final để dùng Constructor Injection
    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService; // Sửa từ EmailServiceImpl thành EmailService (Interface)

    // @Value không dùng được với @RequiredArgsConstructor mặc định, nên để nguyên hoặc dùng setter
    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_FOUND));

        // Vô hiệu hóa các token cũ chưa sử dụng của user này (nếu có)
        tokenRepository.findByUserAndUsedFalse(user).ifPresent(token -> {
            token.setUsed(true);
            tokenRepository.save(token);
        });

        // Tạo token mới
        String token = UUID.randomUUID().toString();

        // Tính thời gian hết hạn (Dùng mili-giây thay vì Calendar cho nhẹ)
        Date expiryDate = new Date(System.currentTimeMillis() + (EXPIRATION_HOURS * 60 * 60 * 1000));

        // Lưu token
        // Đảm bảo entity PasswordResetToken có constructor này hoặc dùng builder
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(expiryDate);
        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        // Gửi email qua Interface
        // Lưu ý: baseUrl nên là URL của Frontend (React/Vue) chứ không phải Backend
        String resetLink = baseUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);

        log.info("Password reset email sent to: {}", email);
    }

    @Override
    public boolean validateToken(String token) {
        return tokenRepository.findByToken(token)
                .map(resetToken -> !resetToken.isUsed() && !resetToken.isExpired())
                .orElse(false);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordDTO dto) {
        // Kiểm tra khớp mật khẩu
        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_MISMATCH);
        }

        // Tìm token
        PasswordResetToken resetToken = tokenRepository.findByToken(dto.getToken())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_RESET_TOKEN));

        // Validate các trường hợp lỗi
        if (resetToken.isUsed()) {
            throw new AppException(ErrorCode.TOKEN_ALREADY_USED);
        }

        if (resetToken.isExpired()) {
            throw new AppException(ErrorCode.INVALID_RESET_TOKEN);
        }

        // Cập nhật mật khẩu user
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        // Đánh dấu token đã dùng
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        log.info("Password reset successful for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 */6 * * *") // Chạy mỗi 6 tiếng
    public void cleanupExpiredTokens() {
        // Lưu ý: Hàm deleteByExpiryDateBefore cần được khai báo trong Repository
        tokenRepository.deleteByExpiryDateBefore(new Date());
        log.info("Expired password reset tokens cleaned up");
    }
}