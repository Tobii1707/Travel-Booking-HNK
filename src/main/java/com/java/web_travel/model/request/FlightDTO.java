package com.java.web_travel.model.request;

import com.java.web_travel.enums.TicketClass;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FlightDTO {

    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String departureLocation;

    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String arrivalLocation;

    @NotNull(message ="ARGUMENT_NOT_VALID" )
    private TicketClass ticketClass;

    @NotNull(message = "ARGUMENT_NOT_VALID")
    private Long airlineId;

    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String airplaneName;

    @Min(value = 0 ,message = "NUMBER_NOT_VALID")
    private double price;

    @NotNull(message = "ARGUMENT_NOT_VALID")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date checkInDate ;

    @NotNull(message = "ARGUMENT_NOT_VALID")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date checkOutDate ;

    @Min(value = 0, message = "NUMBER_NOT_VALID")
    private int numberOfChairs ;
}