package com.java.web_travel.convert;

import com.java.web_travel.entity.Hotel;
import com.java.web_travel.entity.HotelBedroom;
import com.java.web_travel.enums.RoomStatus;
import com.java.web_travel.model.request.HotelDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class HotelConverter {
    public Hotel convertHotel(HotelDTO hotelDto) {
        Hotel hotel = new Hotel();

        hotel.setHotelName(hotelDto.getHotelName());
        hotel.setHotelPriceFrom(hotelDto.getPriceFrom());
        hotel.setAddress(hotelDto.getAddress());
        hotel.setNumberFloor(hotelDto.getNumberFloor());

        List<HotelBedroom> hotelBedroomList = new ArrayList<HotelBedroom>();
        for(int i = 1 ; i <= hotelDto.getNumberFloor() ; i++) {
            for(int j = 1 ; j <= 10 ; j++) {
                HotelBedroom hotelBedroom = new HotelBedroom();

                hotelBedroom.setRoomNumber((long) (i*100 + j)); // room number eg : 101-110
                if(j == 6 || j == 8) {
                    hotelBedroom.setPrice(hotelDto.getPriceFrom() * 1.5);
                    hotelBedroom.setRoomType("Vip Room");
                }else {
                    hotelBedroom.setPrice(hotelDto.getPriceFrom());
                    hotelBedroom.setRoomType("Normal Room");
                }
                hotelBedroom.setHotel(hotel);

                hotelBedroomList.add(hotelBedroom);
            }
        }
        hotel.setHotelBedrooms(hotelBedroomList);
        return hotel;
    }
}
