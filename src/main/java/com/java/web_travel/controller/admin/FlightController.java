package com.java.web_travel.controller.admin;

import com.java.web_travel.entity.Flight;
import com.java.web_travel.entity.FlightPriceHistory;
import com.java.web_travel.model.request.FlightDTO;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.service.FlightService;
import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/flight")
@Slf4j
public class FlightController {

    @Autowired
    private FlightService flightService;

    // --- 1. TẠO MỚI (Admin chọn hãng từ Dropdown -> gửi airlineId) ---
    @PostMapping("/create")
    public ApiResponse<Flight> createFlight(@Valid @RequestBody FlightDTO flightDTO) {
        log.info("Create flight request with Airline ID: {}", flightDTO.getAirlineId());
        ApiResponse<Flight> apiResponse = new ApiResponse<>();
        Flight flight = flightService.createFlight(flightDTO);
        apiResponse.setData(flight);
        apiResponse.setMessage("Flight created successfully");
        return apiResponse;
    }

    // --- 2. XÓA (Xóa mềm) ---
    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> deleteFlight(@PathVariable Long id) {
        flightService.deleteFlight(id);
        ApiResponse<Void> apiResponse = new ApiResponse<>();
        apiResponse.setMessage("Flight moved to trash successfully");
        return apiResponse;
    }

    // --- 3. CẬP NHẬT ---
    @PatchMapping("/update/{id}")
    public ApiResponse<Flight> updateFlight(@PathVariable Long id, @Valid @RequestBody FlightDTO flightDTO) {
        ApiResponse<Flight> apiResponse = new ApiResponse<>();
        apiResponse.setData(flightService.updateFlight(id, flightDTO));
        apiResponse.setMessage("Flight updated successfully");
        return apiResponse;
    }

    // --- 4. LẤY TẤT CẢ (Dành cho ADMIN - Xem cả chuyến đã bay và chưa bay) ---
    @GetMapping("/getAll")
    public ApiResponse<List<Flight>> getAllFlights() {
        ApiResponse<List<Flight>> apiResponse = new ApiResponse<>();
        apiResponse.setData(flightService.getAllFlights());
        apiResponse.setMessage("success");
        return apiResponse;
    }

    // --- 5. GỢI Ý CHUYẾN BAY (Cho khách hàng) ---
    @GetMapping("/suggest")
    public ApiResponse<List<Flight>> suggestFlights(
            @RequestParam String from,
            @RequestParam String to
    ) {
        List<Flight> flights = flightService.getSuggestedFlights(from, to);
        ApiResponse<List<Flight>> apiResponse = new ApiResponse<>();
        apiResponse.setData(flights);
        apiResponse.setMessage(flights.isEmpty() ? "No flights found" : "Found " + flights.size() + " flights");
        return apiResponse;
    }

    // --- 6. TÌM KIẾM CHUYẾN BAY DÀNH CHO ADMIN (ĐÃ TỐI ƯU GỌI XUỐNG DB) ---
    @GetMapping("/admin-search")
    public ApiResponse<List<Flight>> searchFlightAdmin(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String departure,
            @RequestParam(required = false) String arrival,
            @RequestParam(required = false) Long airlineId
    ) {
        log.info("Admin search flights with keyword: {}, departure: {}, arrival: {}, airlineId: {}",
                keyword, departure, arrival, airlineId);

        // Gọi thẳng xuống Service, DB sẽ đảm nhiệm việc lọc dữ liệu
        List<Flight> searchResults = flightService.searchFlightsForAdmin(keyword, departure, arrival, airlineId);

        ApiResponse<List<Flight>> response = new ApiResponse<>();
        response.setData(searchResults);
        response.setMessage(searchResults.isEmpty() ? "No flights found" : "Found " + searchResults.size() + " flights");
        return response;
    }

    // --- 7. LẤY DANH SÁCH TRONG THÙNG RÁC (Cho Admin) ---
    @GetMapping("/trash")
    public ApiResponse<List<Flight>> getDeletedFlights() {
        ApiResponse<List<Flight>> apiResponse = new ApiResponse<>();
        apiResponse.setData(flightService.getDeletedFlights());
        apiResponse.setMessage("Fetched trash successfully");
        return apiResponse;
    }

    // --- 8. KHÔI PHỤC CHUYẾN BAY (Cho Admin) ---
    @PatchMapping("/restore/{id}")
    public ApiResponse<Flight> restoreFlight(@PathVariable Long id) {
        ApiResponse<Flight> apiResponse = new ApiResponse<>();
        apiResponse.setData(flightService.restoreFlight(id));
        apiResponse.setMessage("Flight restored successfully");
        return apiResponse;
    }

    // --- 9. LẤY DANH SÁCH CHUYẾN BAY SẮP TỚI (Cho trang chủ/Trang đặt vé của Khách) ---
    @GetMapping("/upcoming")
    public ApiResponse<List<Flight>> getUpcomingFlights() {
        ApiResponse<List<Flight>> apiResponse = new ApiResponse<>();
        apiResponse.setData(flightService.getUpcomingFlightsForUser());
        apiResponse.setMessage("success");
        return apiResponse;
    }

    // --- 10. TẠO NHIỀU CHUYẾN BAY CÙNG LÚC (BATCH CREATE) ---
    @PostMapping("/create-batch/{airlineId}")
    public ApiResponse<List<Flight>> createMultipleFlights(
            @PathVariable Long airlineId,
            @Valid @RequestBody List<FlightDTO> flightDTOs) {
        log.info("Create multiple flights request with Airline ID: {} and size: {}", airlineId, flightDTOs.size());

        List<Flight> createdFlights = flightService.createMultipleFlights(airlineId, flightDTOs);

        ApiResponse<List<Flight>> apiResponse = new ApiResponse<>();
        apiResponse.setData(createdFlights);
        apiResponse.setMessage("Successfully created " + createdFlights.size() + " flights");
        return apiResponse;
    }

    // --- 11. ĐIỀU CHỈNH GIÁ VĨNH VIỄN CHO CÁC CHUYẾN BAY ĐƯỢC CHỌN (BATCH UPDATE) ---

    // Tạo Class DTO nhỏ để hứng dữ liệu từ Frontend
    @Getter
    @Setter
    public static class PriceAdjustmentRequest {
        private List<Long> flightIds;
        private double percentage;
    }

    @PatchMapping("/adjust-price-batch")
    public ApiResponse<Void> adjustPriceForSelectedFlights(@RequestBody PriceAdjustmentRequest request) {
        log.info("Admin request to adjust prices for {} flights by {}%",
                request.getFlightIds() != null ? request.getFlightIds().size() : 0,
                request.getPercentage());

        flightService.adjustPriceForSelectedFlights(request.getFlightIds(), request.getPercentage());

        ApiResponse<Void> apiResponse = new ApiResponse<>();
        String action = request.getPercentage() > 0 ? "increased" : "decreased";
        apiResponse.setMessage("Flight prices successfully " + action + " by " + Math.abs(request.getPercentage()) + "%");
        return apiResponse;
    }

    // --- 12. XEM LỊCH SỬ THAY ĐỔI GIÁ CỦA CHUYẾN BAY ---
    @GetMapping("/price-history/{id}")
    public ApiResponse<List<FlightPriceHistory>> getFlightPriceHistory(@PathVariable Long id) {
        log.info("Admin fetch price history for flight ID: {}", id);

        List<FlightPriceHistory> historyList = flightService.getFlightPriceHistory(id);

        ApiResponse<List<FlightPriceHistory>> apiResponse = new ApiResponse<>();
        apiResponse.setData(historyList);
        apiResponse.setMessage(historyList.isEmpty() ? "No history found" : "Fetched history successfully");
        return apiResponse;
    }
}