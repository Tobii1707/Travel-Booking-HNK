package com.java.web_travel.model.request;

import com.java.web_travel.entity.HotelBedroom;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class OrderHotelDTO {
    @NotNull(message = "ARGUMENT_NOT_VALID")
    private Date startHotel ;

    @NotNull(message = "ARGUMENT_NOT_VALID")
    private Date endHotel ;

    @NotNull(message = "ARGUMENT_NOT_VALID")
    private List<HotelBedroom> hotelBedroomList ;
}
