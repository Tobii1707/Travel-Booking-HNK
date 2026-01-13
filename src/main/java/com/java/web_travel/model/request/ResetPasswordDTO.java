package com.java.web_travel.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ResetPasswordDTO {

    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String token;

    @NotBlank(message = "ARGUMENT_NOT_VALID")
    @Size(min = 6, message = "LENGTH_PASS_NOT_VALID")
    private String newPassword;

    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String confirmPassword;
}
