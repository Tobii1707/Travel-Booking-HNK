package com.java.web_travel.model.request;

import com.java.web_travel.enums.TicketClass;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;
@Getter
@Setter
@AllArgsConstructor
public class FlightDTO {
    @NotNull(message ="ARGUMENT_NOT_VALID" )
    private TicketClass ticketClass;
    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String airlineName ;
    @Min(value = 0 ,message = "NUMBER_NOT_VALID")
    private double price;
    @NotNull(message = "ARGUMENT_NOT_VALID")
    @DateTimeFormat()
    private Date checkInDate ;
    @NotNull(message = "ARGUMENT_NOT_VALID")
    @DateTimeFormat()
    private Date checkOutDate ;
    @Min(0)
    private int numberOfChairs ;
}
