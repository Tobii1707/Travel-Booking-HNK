package com.java.web_travel.model.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;
@Getter
@Setter
@AllArgsConstructor
public class OrderDTO {
    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String destination ;
    @NotNull(message = "ARGUMENT_NOT_VALID")
    @Min(value = 1,message = "NUMBER_NOT_VALID")
    private Integer numberOfPeople ;
    @NotNull(message = "ARGUMENT_NOT_VALID")
    private Date checkInDate ;
    @NotNull(message = "ARGUMENT_NOT_VALID")
    private Date checkOutDate ;
}
