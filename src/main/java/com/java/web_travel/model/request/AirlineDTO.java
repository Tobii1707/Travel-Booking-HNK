package com.java.web_travel.model.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AirlineDTO {

    @NotBlank(message = "ARGUMENT_NOT_VALID") // Tên hãng không được để trống
    private String airlineName;

    private String description;
}