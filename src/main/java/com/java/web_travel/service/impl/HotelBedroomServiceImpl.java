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
import org.springframework.beans.BeanUtils; // [FIX] Import thêm thư viện copy object
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList; // [FIX] Import ArrayList
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
        // Hàm này là Transactional nên save() sẽ update giá gốc vào DB -> Đúng logic update
        return hotelBedroomRepository.save(room);
    }

    @Override
    @Transactional
    public void deleteRoom(Long roomId) {
        HotelBedroom room = hotelBedroomRepository.findById(roomId)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));
        hotelBedroomRepository.delete(room);
    }

    // --- [PHẦN ĐÃ SỬA LẠI AN TOÀN] ---
    @Override
    public List<HotelBedroom> getRoomsByHotel(Long hotelId, LocalDate checkInDate) {
        // 1. Lấy thông tin Hotel
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        // 2. Lấy danh sách phòng gốc từ DB
        List<HotelBedroom> originalRooms = hotelBedroomRepository.findByHotelId(hotelId);

        // Tạo danh sách kết quả để trả về (chứa các bản copy)
        List<HotelBedroom> responseRooms = new ArrayList<>();

        // 3. Logic tính giá
        double rate = 1.0;
        if (hotel.getHotelGroup() != null) {
            LocalDate targetDate = (checkInDate != null) ? checkInDate : LocalDate.now();
            List<HolidayPolicy> policies = holidayPolicyRepository
                    .findActivePolicies(hotel.getHotelGroup().getId(), targetDate);

            if (!policies.isEmpty()) {
                rate = 1.0 + (policies.get(0).getIncreasePercentage() / 100.0);
            }
        }

        // 4. Loop và Copy
        for (HotelBedroom original : originalRooms) {
            // [QUAN TRỌNG] Tạo object mới và copy dữ liệu sang
            // Việc này giúp tách object ra khỏi Hibernate Session -> Không bị tự động Update vào DB
            HotelBedroom displayRoom = new HotelBedroom();
            BeanUtils.copyProperties(original, displayRoom);

            // Tính toán giá trên object COPY (Giá gốc * rate)
            displayRoom.setPrice(smartRoundPrice(original.getPrice() * rate));

            responseRooms.add(displayRoom);
        }

        return responseRooms;
    }

    @Override
    public HotelBedroom getRoom(Long roomId) {
        HotelBedroom original = hotelBedroomRepository.findById(roomId)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));

        // [QUAN TRỌNG] Cũng phải copy ở hàm lẻ này
        HotelBedroom displayRoom = new HotelBedroom();
        BeanUtils.copyProperties(original, displayRoom);

        Hotel hotel = original.getHotel();
        if (hotel != null && hotel.getHotelGroup() != null) {
            LocalDate today = LocalDate.now();
            List<HolidayPolicy> policies = holidayPolicyRepository
                    .findActivePolicies(hotel.getHotelGroup().getId(), today);

            if (!policies.isEmpty()) {
                HolidayPolicy policy = policies.get(0);
                double rate = 1.0 + (policy.getIncreasePercentage() / 100.0);

                // Set giá trên bản copy
                displayRoom.setPrice(smartRoundPrice(original.getPrice() * rate));
            }
        }
        return displayRoom;
    }

    @Override
    public List<Long> getBookedRoomIds(Long hotelId, Date startDate, Date endDate) {
        return hotelBookingRepository.findBookedRoomIds(hotelId, startDate, endDate);
    }
}