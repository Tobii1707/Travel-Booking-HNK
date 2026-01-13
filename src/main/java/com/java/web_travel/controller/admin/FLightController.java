package com.java.web_travel.controller.admin;

// Import các class cần thiết (Entity, DTO, Response Wrapper, Service...)
import com.java.web_travel.entity.Flight;
import com.java.web_travel.model.request.FlightDTO;
import com.java.web_travel.model.response.ApiReponse;
import com.java.web_travel.service.FlightService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/flight")
@Slf4j
public class FLightController {

    @Autowired
    private FlightService flightService;

    // --- API 1: TẠO MỚI CHUYẾN BAY ---
    @PostMapping("/create")
    public ApiReponse<Flight> createFlight(@Valid @RequestBody FlightDTO flightDTO) {
        // @Valid: Kiểm tra dữ liệu đầu vào (VD: tên không được rỗng) dựa trên rule trong file FlightDTO.
        // @RequestBody: Ép kiểu dữ liệu JSON gửi lên từ Client thành object Java (FlightDTO).

        // Ghi log ra console để biết đang nhận được dữ liệu gì
        log.info("Create flightDTO: {}", flightDTO);

        // Khởi tạo đối tượng trả về chuẩn (Wrapper response)
        ApiReponse<Flight> apiReponse = new ApiReponse<>();

        // Gọi Service để thực hiện logic tạo chuyến bay và lưu vào DB
        Flight flight = flightService.createFlight(flightDTO);

        // Gán dữ liệu chuyến bay vừa tạo vào kết quả trả về
        apiReponse.setData(flight);
        // Gán thông báo thành công
        apiReponse.setMessage("Flight created");

        // Ghi log thông báo đã xong việc
        log.info("Flight created successfully: {}", flight);

        // Trả kết quả JSON về cho người dùng
        return apiReponse;
    }

    // --- API 2: XÓA CHUYẾN BAY ---
    @DeleteMapping("/delete/{id}")
    public ApiReponse<Flight> deleteFlight(@PathVariable Long id) {
        // @PathVariable: Lấy giá trị {id} trên URL gán vào biến 'id' của hàm.

        log.info("Delete flight id = : {}", id); // Ghi log ID chuẩn bị xóa

        ApiReponse<Flight> apiReponse = new ApiReponse<>();

        // Gọi Service để xóa bản ghi trong Database theo ID
        flightService.deleteFlight(id);

        apiReponse.setMessage("Flight deleted"); // Thông báo xóa thành công
        log.info("Flight deleted successfully id = : {}", id); // Ghi log hoàn tất

        return apiReponse;
    }

    // --- API 3: CẬP NHẬT CHUYẾN BAY ---
    @PatchMapping("/update/{id}")
    public ApiReponse<Flight> updateFlight(@PathVariable Long id, @Valid @RequestBody FlightDTO flightDTO) {
        // Hàm này cần 2 tham số:
        // 1. id: Lấy từ URL (@PathVariable) để biết sửa chuyến bay nào.
        // 2. flightDTO: Lấy từ Body JSON (@RequestBody) để biết thông tin mới là gì.

        log.info("Update flight id = {}", id);
        ApiReponse<Flight> apiReponse = new ApiReponse<>();

        // Gọi Service xử lý update, sau đó gán kết quả đã update vào data trả về
        apiReponse.setData(flightService.updateFlight(id, flightDTO));
        apiReponse.setMessage("Flight updated");

        log.info("Flight updated successfully id = {}", id);
        return apiReponse;
    }

    // --- API 4: LẤY DANH SÁCH TẤT CẢ ---
    @GetMapping("/getAll")
    public ApiReponse<List<Flight>> getAllFlights() {
        log.info("Get all flights");

        // Lưu ý: Kiểu dữ liệu trả về ở đây là List<Flight> (Danh sách)
        ApiReponse<List<Flight>> apiReponse = new ApiReponse<>();

        // Gọi Service lấy toàn bộ danh sách từ DB
        apiReponse.setData(flightService.getAllFlights());
        apiReponse.setMessage("success");

        log.info("Get all success");
        return apiReponse;
    }
}