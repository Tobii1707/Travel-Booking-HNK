package com.java.web_travel.model.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailDTO {
    @NotBlank(message = "EMAIL_TO_NOT_BLANK")
    private String toEmail;

    @NotBlank(message = "SUBJECT_NOT_BLANK")
    private String subject;

    @NotBlank(message = "BODY_NOT_BLANK")
    private String body;
}
