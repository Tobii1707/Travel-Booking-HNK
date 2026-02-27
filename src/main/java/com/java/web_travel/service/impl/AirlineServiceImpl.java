package com.java.web_travel.service.impl;

import com.java.web_travel.entity.Airline;
import com.java.web_travel.entity.Flight;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.AirlineDTO;
import com.java.web_travel.repository.AirlineRepository;
import com.java.web_travel.repository.FlightRepository;
import com.java.web_travel.service.AirlineService;
import com.java.web_travel.service.FlightService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AirlineServiceImpl implements AirlineService {

    @Autowired
    private AirlineRepository airlineRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private FlightService flightService;

    // --- 1. TẠO HÃNG MỚI ---
    @Override
    public Airline createAirline(AirlineDTO airlineDTO) {
        if (airlineRepository.existsByAirlineName(airlineDTO.getAirlineName())) {
            throw new AppException(ErrorCode.AIRLINE_EXISTED);
        }

        Airline airline = new Airline();
        airline.setAirlineName(airlineDTO.getAirlineName());
        airline.setDescription(airlineDTO.getDescription());
        airline.setDeleted(false);

        return airlineRepository.save(airline);
    }

    // --- 2. CẬP NHẬT HÃNG ---
    @Override
    public Airline updateAirline(Long id, AirlineDTO airlineDTO) {
        Airline airline = getAirlineById(id);

        if (!airline.getAirlineName().equals(airlineDTO.getAirlineName())) {
            if (airlineRepository.existsByAirlineName(airlineDTO.getAirlineName())) {
                throw new AppException(ErrorCode.AIRLINE_EXISTED);
            }
        }

        airline.setAirlineName(airlineDTO.getAirlineName());
        airline.setDescription(airlineDTO.getDescription());

        return airlineRepository.save(airline);
    }

    // --- 3. XÓA MỀM (SOFT DELETE) DÂY CHUYỀN ---
    @Override
    @Transactional
    public void deleteAirline(Long id) {
        Airline airline = getAirlineById(id);

        List<Flight> flights = flightRepository.findByAirlineId(airline.getId());

        if (flights != null && !flights.isEmpty()) {
            for (Flight flight : flights) {
                if (!flight.isDeleted()) {
                    flightService.deleteFlight(flight.getId());
                }
            }
        }

        airline.setDeleted(true);
        airlineRepository.save(airline);
    }

    // --- 4. LẤY CHI TIẾT ---
    @Override
    public Airline getAirlineById(Long id) {
        Airline airline = airlineRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AIRLINE_NOT_FOUND));

        if (airline.isDeleted()) {
            throw new AppException(ErrorCode.AIRLINE_NOT_FOUND);
        }
        return airline;
    }

    // --- 5. LẤY DANH SÁCH ---
    @Override
    public List<Airline> getAllAirlines() {

        return airlineRepository.findByDeletedFalse();
    }

    // --- 6. LẤY DANH SÁCH TRONG THÙNG RÁC ---
    @Override
    public List<Airline> getDeletedAirlines() {
        // Cần đảm bảo trong AirlineRepository đã có hàm findByDeletedTrue()
        return airlineRepository.findByDeletedTrue();
    }

    // --- 7. KHÔI PHỤC HÃNG BAY (RESTORE DÂY CHUYỀN) ---
    @Override
    @Transactional
    public Airline restoreAirline(Long id) {
        Airline airline = airlineRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AIRLINE_NOT_FOUND));

        // BƯỚC 1: Khôi phục Hãng bay trước
        airline.setDeleted(false);
        airlineRepository.save(airline);

        // BƯỚC 2: Tìm và khôi phục các chuyến bay của hãng này
        List<Flight> flights = flightRepository.findByAirlineId(airline.getId());
        if (flights != null && !flights.isEmpty()) {
            for (Flight flight : flights) {
                // Chỉ khôi phục những chuyến bay đang bị xóa
                if (flight.isDeleted()) {
                    // Gọi hàm restoreFlight bên FlightService
                    // (Lúc này Hãng bay đã được set deleted=false ở trên, nên sẽ qua được cửa kiểm tra bên FlightService)
                    flightService.restoreFlight(flight.getId());
                }
            }
        }

        return airline;
    }
}