package com.java.web_travel.model.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserUpdateRequest {

    @NotBlank(message = "ARGUMENT_NOT_VALID")
    @Size(min = 10, message = "LENGTH_NOT_VALID")
    String phone ;
    @NotBlank(message = "ARGUMENT_NOT_VALID")
    String fullName ;
    @Email(message = "EMAIL_NOT_VALID")
    String email ;
    @NotNull(message = "ARGUMENT_NOT_VALID")
    Date birthday ;
}
