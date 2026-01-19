package com.java.web_travel.controller.admin;

// Import các class cần thiết (Entity, DTO, Response Wrapper, Service...)
import com.java.web_travel.entity.Flight;
import com.java.web_travel.model.request.FlightDTO;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.service.FlightService;
import jakarta.validation.Valid;
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

    // --- API 1: TẠO MỚI CHUYẾN BAY (GIỮ NGUYÊN) ---
    @PostMapping("/create")
    public ApiResponse<Flight> createFlight(@Valid @RequestBody FlightDTO flightDTO) {
        log.info("Create flightDTO: {}", flightDTO);
        ApiResponse<Flight> apiResponse = new ApiResponse<>();
        Flight flight = flightService.createFlight(flightDTO);
        apiResponse.setData(flight);
        apiResponse.setMessage("Flight created");
        log.info("Flight created successfully: {}", flight);
        return apiResponse;
    }

    // --- API 2: XÓA CHUYẾN BAY (GIỮ NGUYÊN) ---
    @DeleteMapping("/delete/{id}")
    public ApiResponse<Flight> deleteFlight(@PathVariable Long id) {
        log.info("Delete flight id = : {}", id);
        ApiResponse<Flight> apiResponse = new ApiResponse<>();
        flightService.deleteFlight(id);
        apiResponse.setMessage("Flight deleted");
        log.info("Flight deleted successfully id = : {}", id);
        return apiResponse;
    }

    // --- API 3: CẬP NHẬT CHUYẾN BAY (GIỮ NGUYÊN) ---
    @PatchMapping("/update/{id}")
    public ApiResponse<Flight> updateFlight(@PathVariable Long id, @Valid @RequestBody FlightDTO flightDTO) {
        log.info("Update flight id = {}", id);
        ApiResponse<Flight> apiResponse = new ApiResponse<>();
        apiResponse.setData(flightService.updateFlight(id, flightDTO));
        apiResponse.setMessage("Flight updated");
        log.info("Flight updated successfully id = {}", id);
        return apiResponse;
    }

    // --- API 4: LẤY DANH SÁCH TẤT CẢ (GIỮ NGUYÊN) ---
    @GetMapping("/getAll")
    public ApiResponse<List<Flight>> getAllFlights() {
        log.info("Get all flights");
        ApiResponse<List<Flight>> apiResponse = new ApiResponse<>();
        apiResponse.setData(flightService.getAllFlights());
        apiResponse.setMessage("success");
        log.info("Get all success");
        return apiResponse;
    }

    // --- API 5: GỢI Ý CHUYẾN BAY THEO ĐỊA ĐIỂM (MỚI THÊM VÀO) ---
    // URL mẫu: /flight/suggest?from=Hà Nội&to=Đà Nẵng
    @GetMapping("/suggest")
    public ApiResponse<List<Flight>> suggestFlights(
            @RequestParam String from, // Lấy tham số 'from' trên URL
            @RequestParam String to    // Lấy tham số 'to' trên URL
    ) {
        log.info("Request suggest flight from: {} to: {}", from, to);

        ApiResponse<List<Flight>> apiResponse = new ApiResponse<>();

        // Gọi hàm Service mới viết để lấy danh sách
        List<Flight> flights = flightService.getSuggestedFlights(from, to);

        apiResponse.setData(flights);

        // Thông báo kết quả cho rõ ràng
        if(flights.isEmpty()){
            apiResponse.setMessage("No suitable flights found (future flights only)");
        } else {
            apiResponse.setMessage("Found " + flights.size() + " flights");
        }

        log.info("Suggest flight success, found: {}", flights.size());
        return apiResponse;
    }
}