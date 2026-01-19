package com.java.web_travel.convert;

import com.java.web_travel.entity.Hotel;
import com.java.web_travel.entity.HotelBedroom;
import com.java.web_travel.model.request.HotelDTO;
import com.java.web_travel.model.response.HotelResponse;
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

        // --- 1. QUAN TRỌNG: Phải mở dòng này ra để lưu số lượng phòng vào DB ---
        hotel.setNumberRoomPerFloor(hotelDto.getNumberRoomPerFloor());
        // -----------------------------------------------------------------------

        List<HotelBedroom> hotelBedroomList = new ArrayList<>();

        // Vòng lặp các tầng (i)
        for(int i = 1 ; i <= hotelDto.getNumberFloor() ; i++) {

            // Vòng lặp các phòng trong 1 tầng (j) - Đã đúng theo logic động
            for(int j = 1 ; j <= hotelDto.getNumberRoomPerFloor() ; j++) {

                HotelBedroom hotelBedroom = new HotelBedroom();

                // Logic đặt tên phòng: Tầng 1 phòng 1 -> 101
                hotelBedroom.setRoomNumber((long) (i * 100 + j));

                // --- 2. Gợi ý Logic VIP linh hoạt hơn ---
                // Ví dụ: Phòng cuối cùng của hành lang (j == max) hoặc phòng số 6, 8
                boolean isVip = (j == 6 || j == 8) || (j == hotelDto.getNumberRoomPerFloor());

                if(isVip) {
                    hotelBedroom.setPrice(hotelDto.getPriceFrom() * 1.5);
                    hotelBedroom.setRoomType("Vip Room");
                } else {
                    hotelBedroom.setPrice(hotelDto.getPriceFrom());
                    hotelBedroom.setRoomType("Normal Room");
                }

                hotelBedroom.setHotel(hotel); // Set quan hệ 2 chiều
                hotelBedroomList.add(hotelBedroom);
            }
        }

        hotel.setHotelBedrooms(hotelBedroomList);
        return hotel;
    }
    public HotelResponse toHotelResponse(Hotel hotel) {
        HotelResponse response = new HotelResponse();

        // Map từng trường dữ liệu
        response.setId(hotel.getId());
        response.setHotelName(hotel.getHotelName());
        response.setHotelPriceFrom(hotel.getHotelPriceFrom()); // Đã sửa đúng tên
        response.setAddress(hotel.getAddress());
        response.setNumberFloor(hotel.getNumberFloor());

        // --- SỬA LẠI DÒNG NÀY ---
        // Map số phòng 1 tầng (Lúc nãy bạn copy nhầm dòng giá tiền)
        response.setNumberRoomPerFloor(hotel.getNumberRoomPerFloor());

        return response;
    }
}