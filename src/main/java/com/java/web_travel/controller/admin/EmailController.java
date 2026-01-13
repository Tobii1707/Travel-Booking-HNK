package com.java.web_travel.controller.admin;

import com.java.web_travel.model.request.EmailDTO;
import com.java.web_travel.model.response.ApiReponse;
import com.java.web_travel.service.impl.EmailService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/email")
@Slf4j
public class EmailController {
    @Autowired
    private EmailService emailService;

    @PostMapping()
    public ApiReponse sendEmail(@RequestBody @Valid  EmailDTO emailDTO) {
        ApiReponse apiReponse = new ApiReponse();
        try {
            apiReponse.setData(emailService.sendEmail(emailDTO));
            return apiReponse;
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiReponse(7777, e.getMessage());
        }
    }
    @PostMapping("/{orderId}/announce")
    public ApiReponse announceEmail(@PathVariable Long orderId) {
        ApiReponse apiReponse = new ApiReponse();
        try{
            apiReponse.setData(emailService.sendAnnounceEmail(orderId)) ;
            return apiReponse;
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiReponse(7777, e.getMessage());
        }
    }
    @PostMapping("/{orderId}/announce-pay-success")
    public ApiReponse announceEmailPaySuccess(@PathVariable Long orderId) {
        ApiReponse apiReponse = new ApiReponse();
        try{
            apiReponse.setData(emailService.sendAnnouncePaySuccessEmail(orderId)) ;
            return apiReponse;
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiReponse(7777, e.getMessage());
        }
    }
    @PostMapping("/{orderId}/announce-pay-falled")
    public ApiReponse announceEmailPayFalled(@PathVariable Long orderId) {
        ApiReponse apiReponse = new ApiReponse();
        try{
            apiReponse.setData(emailService.sendAnnouncePayFalledEmail(orderId)) ;
            return apiReponse;
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiReponse(7777, e.getMessage());
        }
    }
    @PostMapping("/{orderId}/announce-cancel")
    public ApiReponse announceEmailCancel(@PathVariable Long orderId) {
        ApiReponse apiReponse = new ApiReponse();
        try{
            apiReponse.setData(emailService.sendAnnouceCancel(orderId));
            return apiReponse;
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiReponse(7777, e.getMessage());
        }
    }
}
