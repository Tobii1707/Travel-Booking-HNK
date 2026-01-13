package com.java.web_travel.model.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonInclude;
@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@Builder
public class ContactResponse {
    private Long id;
    private String fullName;
    private String email;
    private String subject;
    private String message;
    private LocalDateTime createdAt;
    private String replyNote; // Gửi câu trả lời về cho Client
    private LocalDateTime repliedAt;
}