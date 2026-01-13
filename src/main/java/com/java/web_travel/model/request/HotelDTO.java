package com.java.web_travel.model.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class HotelDTO {
    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String hotelName;

   @NotNull(message ="ARGUMENT_NOT_VALID" )
   private double priceFrom;

   @NotNull(message = "ARGUMENT_NOT_VALID")
   private String address;

   @Min(value = 1 ,message = "NUMBER_FLOOR_NOT_VALID")
   private int numberFloor;

}
