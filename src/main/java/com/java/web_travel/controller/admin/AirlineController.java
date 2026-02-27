package com.java.web_travel.controller.admin;

import com.java.web_travel.entity.Airline;
import com.java.web_travel.model.request.AirlineDTO;
import com.java.web_travel.model.response.ApiResponse; // Giả sử bạn có class bọc response chung
import com.java.web_travel.service.AirlineService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/airlines")
public class AirlineController {

    @Autowired
    private AirlineService airlineService;

    // 1. Lấy danh sách (Public cho cả Admin và User xem để book vé)
    @GetMapping
    public ResponseEntity<?> getAllAirlines() {
        List<Airline> airlines = airlineService.getAllAirlines();
        return ResponseEntity.ok(airlines);
    }

    // 2. Tạo mới (Dành cho Admin)
    @PostMapping
    public ResponseEntity<?> createAirline(@RequestBody @Valid AirlineDTO airlineDTO) {
        Airline newAirline = airlineService.createAirline(airlineDTO);
        return ResponseEntity.ok(newAirline);
    }

    // 3. Cập nhật (Dành cho Admin)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAirline(@PathVariable Long id, @RequestBody @Valid AirlineDTO airlineDTO) {
        Airline updatedAirline = airlineService.updateAirline(id, airlineDTO);
        return ResponseEntity.ok(updatedAirline);
    }

    // 4. Xóa (Dành cho Admin - Xóa mềm dây chuyền)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAirline(@PathVariable Long id) {
        airlineService.deleteAirline(id);
        return ResponseEntity.ok("Deleted successfully");
    }

    // 5. Xem chi tiết
    @GetMapping("/{id}")
    public ResponseEntity<?> getAirlineById(@PathVariable Long id) {
        return ResponseEntity.ok(airlineService.getAirlineById(id));
    }


    // 6. Lấy danh sách hãng bay đã xóa (Trong thùng rác)
    // URL: GET /api/airlines/trash
    @GetMapping("/trash")
    public ResponseEntity<?> getDeletedAirlines() {
        List<Airline> deletedAirlines = airlineService.getDeletedAirlines();
        return ResponseEntity.ok(deletedAirlines);
    }

    // 7. Khôi phục hãng bay (Khôi phục dây chuyền cả chuyến bay)
    // URL: PATCH /api/airlines/restore/{id}
    @PatchMapping("/restore/{id}")
    public ResponseEntity<?> restoreAirline(@PathVariable Long id) {
        Airline restoredAirline = airlineService.restoreAirline(id);
        return ResponseEntity.ok(restoredAirline);
    }
}