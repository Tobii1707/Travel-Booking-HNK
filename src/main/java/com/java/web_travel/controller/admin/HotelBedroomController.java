package com.java.web_travel.controller.admin;

import com.java.web_travel.entity.HotelBedroom;
import com.java.web_travel.model.request.HotelBedroomDTO;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.service.HotelBedroomService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat; // <--- MỚI: Để xử lý ngày tháng
import org.springframework.web.bind.annotation.*;

import java.util.Date; // <--- MỚI
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/admin")
public class HotelBedroomController {

    @Autowired
    private HotelBedroomService hotelBedroomService;

    // -------------------------------------------------------------------------
    // --- PHẦN CODE CŨ (GIỮ NGUYÊN) -------------------------------------------
    // -------------------------------------------------------------------------

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

    @GetMapping("/rooms/{hotelId}")
    public ApiResponse<List<HotelBedroom>> getRoomsByHotel(@PathVariable Long hotelId) {
        log.info("Getting rooms for hotel id: {}", hotelId);
        ApiResponse<List<HotelBedroom>> response = new ApiResponse<>();
        response.setData(hotelBedroomService.getRoomsByHotel(hotelId));
        return response;
    }

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

    // -------------------------------------------------------------------------
    // --- PHẦN CODE MỚI THÊM VÀO (ĐỂ HIỂN THỊ MÀU ĐỎ/TRẮNG) -------------------
    // -------------------------------------------------------------------------

    // API này trả về danh sách các ID phòng ĐÃ BỊ ĐẶT trong khoảng thời gian chọn
    @GetMapping("/booked-rooms")
    public List<Long> getBookedRooms(
            @RequestParam Long hotelId,
            @RequestParam("startDate") @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam("endDate") @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate
    ) {
        log.info("Checking booked rooms for hotel: {}, from {} to {}", hotelId, startDate, endDate);
        // Gọi Service đã viết trước đó
        return hotelBedroomService.getBookedRoomIds(hotelId, startDate, endDate);
    }
}