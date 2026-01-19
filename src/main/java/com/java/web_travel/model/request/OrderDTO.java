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
public class OrderDTO {

    @NotBlank(message = "DESTINATION_REQUIRED")
    private String destination;

    // --- MỚI: Thêm trường nơi ở hiện tại ---
    @NotBlank(message = "CURRENT_LOCATION_REQUIRED")
    private String currentLocation;

    @NotNull(message = "NUMBER_OF_PEOPLE_REQUIRED")
    @Min(value = 1, message = "NUMBER_NOT_VALID")
    private Integer numberOfPeople;

}