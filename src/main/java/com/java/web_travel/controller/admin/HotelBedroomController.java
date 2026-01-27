package com.java.web_travel.controller.admin;

import com.java.web_travel.entity.HotelBedroom;
import com.java.web_travel.model.request.HotelBedroomDTO;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.service.HotelBedroomService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate; // <--- CẦN IMPORT CÁI NÀY
import java.time.format.DateTimeFormatter; // <--- CẦN IMPORT CÁI NÀY
import java.util.Date;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/admin")
public class HotelBedroomController {

    @Autowired
    private HotelBedroomService hotelBedroomService;

    @PostMapping("/room")
    public ApiResponse<HotelBedroom> createRoom(@Valid @RequestBody HotelBedroomDTO dto) {
        log.info("Creating room: {}", dto);
        ApiResponse<HotelBedroom> response = new ApiResponse<>();
        response.setData(hotelBedroomService.createRoom(dto));
        log.info("Room created successfully");
        return response;
    }

    @GetMapping("/room/{id}")
    public ApiResponse<HotelBedroom> getRoom(@PathVariable Long id) {
        log.info("Getting room with id: {}", id);
        ApiResponse<HotelBedroom> response = new ApiResponse<>();
        response.setData(hotelBedroomService.getRoom(id));
        return response;
    }

    // -------------------------------------------------------------------------
    // --- [SỬA LẠI ĐOẠN NÀY ĐỂ KHỚP VỚI SERVICE] -----------------------------
    // -------------------------------------------------------------------------
    @GetMapping("/rooms/{hotelId}")
    public ApiResponse<List<HotelBedroom>> getRoomsByHotel(
            @PathVariable Long hotelId,
            @RequestParam(required = false) String checkInDate // <--- Nhận thêm ngày từ Frontend
    ) {
        log.info("Getting rooms for hotel id: {}, date: {}", hotelId, checkInDate);

        // 1. Xử lý chuyển đổi String sang LocalDate
        LocalDate date = null;
        if (checkInDate != null && !checkInDate.isEmpty()) {
            try {
                date = LocalDate.parse(checkInDate, DateTimeFormatter.ISO_DATE);
            } catch (Exception e) {
                log.error("Lỗi format ngày: {}", e.getMessage());
                date = LocalDate.now();
            }
        } else {
            date = LocalDate.now();
        }

        ApiResponse<List<HotelBedroom>> response = new ApiResponse<>();

        // 2. Gọi Service với ĐỦ 2 THAM SỐ (Fix lỗi Expected 2 arguments)
        response.setData(hotelBedroomService.getRoomsByHotel(hotelId, date));

        return response;
    }
    // -------------------------------------------------------------------------

    @PutMapping("/room/{id}")
    public ApiResponse<HotelBedroom> updateRoom(@PathVariable Long id, @Valid @RequestBody HotelBedroomDTO dto) {
        log.info("Updating room with id: {}", id);
        ApiResponse<HotelBedroom> response = new ApiResponse<>();
        response.setData(hotelBedroomService.updateRoom(id, dto));
        log.info("Room updated successfully");
        return response;
    }

    @DeleteMapping("/room/{id}")
    public ApiResponse<Void> deleteRoom(@PathVariable Long id) {
        log.info("Deleting room with id: {}", id);
        hotelBedroomService.deleteRoom(id);
        ApiResponse<Void> response = new ApiResponse<>();
        response.setMessage("Room deleted successfully");
        return response;
    }

    // API này trả về danh sách các ID phòng ĐÃ BỊ ĐẶT
    @GetMapping("/booked-rooms")
    public List<Long> getBookedRooms(
            @RequestParam Long hotelId,
            @RequestParam("startDate") @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam("endDate") @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate
    ) {
        log.info("Checking booked rooms for hotel: {}, from {} to {}", hotelId, startDate, endDate);
        return hotelBedroomService.getBookedRoomIds(hotelId, startDate, endDate);
    }
}