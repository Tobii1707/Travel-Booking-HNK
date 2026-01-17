package com.java.web_travel.model.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class HotelBedroomDTO {

    @NotNull(message = "ARGUMENT_NOT_VALID")
    private Long roomNumber;

    @NotNull(message = "ARGUMENT_NOT_VALID")
    @Min(value = 0, message = "PRICE_NOT_VALID")
    private Double price;

    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String roomType;

    @NotNull(message = "ARGUMENT_NOT_VALID")
    private Long hotelId;
}
