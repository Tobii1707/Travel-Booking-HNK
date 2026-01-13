package com.java.web_travel.service;


import com.java.web_travel.model.request.ResetPasswordDTO;

public interface PasswordResetService {

    void requestPasswordReset(String email);

    boolean validateToken(String token);

    void resetPassword(ResetPasswordDTO dto);

    void cleanupExpiredTokens();
}
