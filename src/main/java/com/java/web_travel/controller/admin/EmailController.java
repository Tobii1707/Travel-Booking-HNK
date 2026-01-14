package com.java.web_travel.controller.admin;

import com.java.web_travel.model.request.EmailDTO;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.service.EmailService; // Import Interface
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/email")
@Slf4j
@RequiredArgsConstructor // Sử dụng Constructor Injection
public class EmailController {

    // Inject Interface, không inject Class Impl
    private final EmailService emailService;

    @PostMapping()
    public ApiResponse sendEmail(@RequestBody @Valid EmailDTO emailDTO) {
        ApiResponse apiResponse = new ApiResponse();
        try {
            apiResponse.setData(emailService.sendEmail(emailDTO));
            return apiResponse;
        } catch (Exception e) {
            log.error("Error sending email: {}", e.getMessage());
            return new ApiResponse(7777, e.getMessage());
        }
    }

    @PostMapping("/{orderId}/announce")
    public ApiResponse announceEmail(@PathVariable Long orderId) {
        ApiResponse apiResponse = new ApiResponse();
        try {
            apiResponse.setData(emailService.sendAnnounceEmail(orderId));
            return apiResponse;
        } catch (Exception e) {
            log.error("Error sending announce email for order {}: {}", orderId, e.getMessage());
            return new ApiResponse(7777, e.getMessage());
        }
    }

    @PostMapping("/{orderId}/announce-pay-success")
    public ApiResponse announceEmailPaySuccess(@PathVariable Long orderId) {
        ApiResponse apiResponse = new ApiResponse();
        try {
            apiResponse.setData(emailService.sendAnnouncePaySuccessEmail(orderId));
            return apiResponse;
        } catch (Exception e) {
            log.error("Error sending payment success email for order {}: {}", orderId, e.getMessage());
            return new ApiResponse(7777, e.getMessage());
        }
    }

    @PostMapping("/{orderId}/announce-pay-falled")
    public ApiResponse announceEmailPayFalled(@PathVariable Long orderId) {
        ApiResponse apiResponse = new ApiResponse();
        try {
            apiResponse.setData(emailService.sendAnnouncePayFalledEmail(orderId));
            return apiResponse;
        } catch (Exception e) {
            log.error("Error sending payment failed email for order {}: {}", orderId, e.getMessage());
            return new ApiResponse(7777, e.getMessage());
        }
    }

    @PostMapping("/{orderId}/announce-cancel")
    public ApiResponse announceEmailCancel(@PathVariable Long orderId) {
        ApiResponse apiResponse = new ApiResponse();
        try {
            apiResponse.setData(emailService.sendAnnouceCancel(orderId));
            return apiResponse;
        } catch (Exception e) {
            log.error("Error sending cancel email for order {}: {}", orderId, e.getMessage());
            return new ApiResponse(7777, e.getMessage());
        }
    }
}