package com.java.web_travel.service.impl;

import com.java.web_travel.entity.HolidayPolicy;
import com.java.web_travel.entity.Hotel;
import com.java.web_travel.entity.HotelBedroom;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.HotelBedroomDTO;
import com.java.web_travel.repository.HolidayPolicyRepository;
import com.java.web_travel.repository.HotelBedroomRepository;
import com.java.web_travel.repository.HotelBookingRepository;
import com.java.web_travel.repository.HotelRepository;
import com.java.web_travel.service.HotelBedroomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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

    @Autowired
    private HolidayPolicyRepository holidayPolicyRepository;

    private Double smartRoundPrice(Double rawPrice) {
        if (rawPrice == null) return 0.0;
        return Math.round(rawPrice / 10000.0) * 10000.0;
    }

    // ... (Các hàm create, update, delete giữ nguyên) ...
    @Override
    @Transactional
    public HotelBedroom createRoom(HotelBedroomDTO dto) {
        Hotel hotel = hotelRepository.findById(dto.getHotelId())
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        if (hotelBedroomRepository.existsByHotelIdAndRoomNumber(dto.getHotelId(), dto.getRoomNumber())) {
            throw new AppException(ErrorCode.ROOM_NUMBER_EXISTS);
        }
        if (dto.getPrice() < 0) throw new AppException(ErrorCode.PRICE_NOT_VALID);

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

        if (hotelBedroomRepository.existsByHotelIdAndRoomNumberAndIdNot(
                room.getHotel().getId(), dto.getRoomNumber(), roomId)) {
            throw new AppException(ErrorCode.ROOM_NUMBER_EXISTS);
        }
        if (dto.getPrice() < 0) throw new AppException(ErrorCode.PRICE_NOT_VALID);

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

    // --- [PHẦN SỬA ĐỔI QUAN TRỌNG Ở ĐÂY] ---
    @Override
    public List<HotelBedroom> getRoomsByHotel(Long hotelId, LocalDate checkInDate) {
        // 1. Lấy thông tin Hotel
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        // 2. Lấy danh sách phòng gốc
        List<HotelBedroom> rooms = hotelBedroomRepository.findByHotelId(hotelId);

        // 3. Logic tính giá theo ngày check-in
        if (hotel.getHotelGroup() != null) {
            // Nếu có ngày checkIn truyền vào thì dùng, không thì lấy ngày hiện tại
            LocalDate targetDate = (checkInDate != null) ? checkInDate : LocalDate.now();

            List<HolidayPolicy> policies = holidayPolicyRepository
                    .findActivePolicies(hotel.getHotelGroup().getId(), targetDate);

            if (!policies.isEmpty()) {
                HolidayPolicy policy = policies.get(0);
                double rate = 1.0 + (policy.getIncreasePercentage() / 100.0);

                for (HotelBedroom room : rooms) {
                    room.setPrice(smartRoundPrice(room.getPrice() * rate));
                }
            }
        }
        return rooms;
    }

    // Hàm getRoom lẻ này cũng nên sửa logic tương tự nếu cần,
    // nhưng tạm thời giữ nguyên hoặc dùng LocalDate.now() như cũ nếu Interface chưa đổi hàm này.
    @Override
    public HotelBedroom getRoom(Long roomId) {
        HotelBedroom room = hotelBedroomRepository.findById(roomId)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));

        Hotel hotel = room.getHotel();
        if (hotel != null && hotel.getHotelGroup() != null) {
            LocalDate today = LocalDate.now();
            List<HolidayPolicy> policies = holidayPolicyRepository
                    .findActivePolicies(hotel.getHotelGroup().getId(), today);

            if (!policies.isEmpty()) {
                HolidayPolicy policy = policies.get(0);
                double rate = 1.0 + (policy.getIncreasePercentage() / 100.0);
                room.setPrice(smartRoundPrice(room.getPrice() * rate));
            }
        }
        return room;
    }

    @Override
    public List<Long> getBookedRoomIds(Long hotelId, Date startDate, Date endDate) {
        return hotelBookingRepository.findBookedRoomIds(hotelId, startDate, endDate);
    }
}