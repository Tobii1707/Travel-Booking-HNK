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

    // --- 1. DTO -> Entity (Dùng khi tạo mới/update) ---
    public Hotel convertHotel(HotelDTO hotelDto) {
        Hotel hotel = new Hotel();

        hotel.setHotelName(hotelDto.getHotelName());
        hotel.setHotelPriceFrom(hotelDto.getPriceFrom());
        hotel.setAddress(hotelDto.getAddress());
        hotel.setNumberFloor(hotelDto.getNumberFloor());
        hotel.setNumberRoomPerFloor(hotelDto.getNumberRoomPerFloor());

        // Logic tạo phòng tự động
        List<HotelBedroom> hotelBedroomList = new ArrayList<>();

        // Vòng lặp các tầng (i)
        for(int i = 1 ; i <= hotelDto.getNumberFloor() ; i++) {

            // Vòng lặp các phòng trong 1 tầng (j)
            for(int j = 1 ; j <= hotelDto.getNumberRoomPerFloor() ; j++) {

                HotelBedroom hotelBedroom = new HotelBedroom();

                // Logic đặt tên phòng: Tầng 1 phòng 1 -> 101
                hotelBedroom.setRoomNumber((long) (i * 100 + j));

                // Logic VIP: Phòng cuối hành lang hoặc số 6, 8 là VIP
                boolean isVip = (j == 6 || j == 8) || (j == hotelDto.getNumberRoomPerFloor());

                if(isVip) {
                    hotelBedroom.setPrice(hotelDto.getPriceFrom() * 1.5);
                    hotelBedroom.setRoomType("Vip Room");
                } else {
                    hotelBedroom.setPrice(hotelDto.getPriceFrom());
                    hotelBedroom.setRoomType("Normal Room");
                }

                // Quan trọng: Set quan hệ 2 chiều để Hibernate lưu được
                hotelBedroom.setHotel(hotel);
                hotelBedroomList.add(hotelBedroom);
            }
        }

        hotel.setHotelBedrooms(hotelBedroomList);
        return hotel;
    }

    // --- 2. Entity -> Response (Dùng để hiển thị ra FE) ---
    public HotelResponse toHotelResponse(Hotel hotel) {
        HotelResponse response = new HotelResponse();

        response.setId(hotel.getId());
        response.setHotelName(hotel.getHotelName());
        response.setHotelPriceFrom(hotel.getHotelPriceFrom());
        response.setAddress(hotel.getAddress());
        response.setNumberFloor(hotel.getNumberFloor());

        // Đã sửa lại đúng logic map số phòng
        response.setNumberRoomPerFloor(hotel.getNumberRoomPerFloor());

        // Map thêm thông tin Group nếu có (để hiển thị tên chuỗi khách sạn)
        if (hotel.getHotelGroup() != null) {
            response.setHotelGroupId(hotel.getHotelGroup().getId());
            response.setGroupName(hotel.getHotelGroup().getGroupName());
        }

        // --- LƯU Ý QUAN TRỌNG ---
        // Chúng ta KHÔNG set hotelBedrooms ở đây.
        // Lý do: Để hàm getAllHotels() chạy nhanh, không phải query database lấy hàng nghìn phòng.
        // Danh sách phòng sẽ được set thủ công bên Service (hàm getHotel) khi người dùng xem chi tiết.

        return response;
    }
}