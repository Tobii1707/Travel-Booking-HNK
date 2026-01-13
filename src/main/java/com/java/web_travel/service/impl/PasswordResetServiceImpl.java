package com.java.web_travel.service.impl;

import com.java.web_travel.entity.PasswordResetToken;
import com.java.web_travel.entity.User;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.ResetPasswordDTO;
import com.java.web_travel.repository.PasswordResetTokenRepository;
import com.java.web_travel.repository.UserRepository;
import com.java.web_travel.service.PasswordResetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;
import java.util.UUID;

@Service
@Slf4j
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final int EXPIRATION_HOURS = 1;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_FOUND));

        // Invalidate any existing tokens for this user
        tokenRepository.findByUserAndUsedFalse(user).ifPresent(token -> {
            token.setUsed(true);
            tokenRepository.save(token);
        });

        // Generate new token
        String token = UUID.randomUUID().toString();

        // Calculate expiry date (1 hour from now)
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.HOUR, EXPIRATION_HOURS);
        Date expiryDate = calendar.getTime();

        // Save token
        PasswordResetToken resetToken = new PasswordResetToken(token, user, expiryDate);
        tokenRepository.save(resetToken);

        // Send email
        String resetLink = baseUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);

        log.info("Password reset email sent to: {}", email);
    }

    @Override
    public boolean validateToken(String token) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token).orElse(null);

        if (resetToken == null) {
            return false;
        }

        if (resetToken.isUsed()) {
            return false;
        }

        if (resetToken.isExpired()) {
            return false;
        }

        return true;
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordDTO dto) {
        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_MISMATCH);
        }

        PasswordResetToken resetToken = tokenRepository.findByToken(dto.getToken())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_RESET_TOKEN));

        if (resetToken.isUsed()) {
            throw new AppException(ErrorCode.TOKEN_ALREADY_USED);
        }

        if (resetToken.isExpired()) {
            throw new AppException(ErrorCode.INVALID_RESET_TOKEN);
        }

        // Update user password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        log.info("Password reset successful for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 */6 * * *") // Run every 6 hours
    public void cleanupExpiredTokens() {
        tokenRepository.deleteByExpiryDateBefore(new Date());
        log.info("Expired password reset tokens cleaned up");
    }
}

