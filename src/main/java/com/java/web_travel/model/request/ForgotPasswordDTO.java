package com.java.web_travel.model.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ForgotPasswordDTO {

    @NotBlank(message = "ARGUMENT_NOT_VALID")
    @Email(message = "EMAIL_INVALID_FORMAT")
    private String email;
}