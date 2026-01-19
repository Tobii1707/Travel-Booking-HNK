package com.java.web_travel.service.impl;

import com.java.web_travel.entity.Hotel;
import com.java.web_travel.entity.HotelBedroom;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.HotelBedroomDTO;
import com.java.web_travel.repository.HotelBedroomRepository;
import com.java.web_travel.repository.HotelBookingRepository;
import com.java.web_travel.repository.HotelRepository;
import com.java.web_travel.service.HotelBedroomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
public class HotelBedroomServiceImpl implements HotelBedroomService {

    @Autowired
    private HotelBedroomRepository hotelBedroomRepository;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private HotelBookingRepository hotelBookingRepository;

    @Override
    @Transactional
    public HotelBedroom createRoom(HotelBedroomDTO dto) {
        Hotel hotel = hotelRepository.findById(dto.getHotelId())
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        if (hotelBedroomRepository.existsByHotelIdAndRoomNumber(dto.getHotelId(), dto.getRoomNumber())) {
            throw new AppException(ErrorCode.ROOM_NUMBER_EXISTS);
        }

        if (dto.getPrice() < 0) {
            throw new AppException(ErrorCode.PRICE_NOT_VALID);
        }

        HotelBedroom room = new HotelBedroom();
        room.setRoomNumber(dto.getRoomNumber());
        room.setPrice(dto.getPrice());
        room.setRoomType(dto.getRoomType());
        room.setHotel(hotel);

        return hotelBedroomRepository.save(room);
    }

    @Override
    @Transactional
    public HotelBedroom updateRoom(Long roomId, HotelBedroomDTO dto) {
        HotelBedroom room = hotelBedroomRepository.findById(roomId)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));

        // Check if room number already exists for another room in the same hotel
        if (hotelBedroomRepository.existsByHotelIdAndRoomNumberAndIdNot(
                room.getHotel().getId(), dto.getRoomNumber(), roomId)) {
            throw new AppException(ErrorCode.ROOM_NUMBER_EXISTS);
        }

        if (dto.getPrice() < 0) {
            throw new AppException(ErrorCode.PRICE_NOT_VALID);
        }

        room.setRoomNumber(dto.getRoomNumber());
        room.setPrice(dto.getPrice());
        room.setRoomType(dto.getRoomType());

        return hotelBedroomRepository.save(room);
    }

    @Override
    @Transactional
    public void deleteRoom(Long roomId) {
        HotelBedroom room = hotelBedroomRepository.findById(roomId)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));
        hotelBedroomRepository.delete(room);
    }

    @Override
    public List<HotelBedroom> getRoomsByHotel(Long hotelId) {
        if (!hotelRepository.existsById(hotelId)) {
            throw new AppException(ErrorCode.HOTEL_NOT_FOUND);
        }
        return hotelBedroomRepository.findByHotelId(hotelId);
    }

    @Override
    public HotelBedroom getRoom(Long roomId) {
        return hotelBedroomRepository.findById(roomId)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));
    }
    @Override
    public List<Long> getBookedRoomIds(Long hotelId, Date startDate, Date endDate) {
        // Hàm này gọi repository để lấy danh sách ID các phòng đã có người đặt
        // Frontend sẽ dùng list này để tô màu đỏ
        return hotelBookingRepository.findBookedRoomIds(hotelId, startDate, endDate);
    }
}
