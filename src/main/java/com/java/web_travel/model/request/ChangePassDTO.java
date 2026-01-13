package com.java.web_travel.model.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class ChangePassDTO {
    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String phone ;
    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String password ;
    @NotBlank(message = "ARGUMENT_NOT_VALID")
    @Size(min = 6, message = "LENGTH_PASS_NOT_VALID")
    private String newPassword ;
    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String confirmPassword ;
}
