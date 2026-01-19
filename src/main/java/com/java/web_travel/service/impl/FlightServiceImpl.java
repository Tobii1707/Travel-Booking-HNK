package com.java.web_travel.service.impl;

import com.java.web_travel.entity.Flight;
import com.java.web_travel.entity.Order;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.FlightDTO;
import com.java.web_travel.repository.FlightRepository;
import com.java.web_travel.repository.OrderRepository;
import com.java.web_travel.service.FlightService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class FlightServiceImpl implements FlightService {

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private OrderRepository orderRepository;

    // --- 1. TẠO CHUYẾN BAY MỚI (GIỮ NGUYÊN) ---
    @Override
    public Flight createFlight(FlightDTO flightDTO) {
        // Validation 1: Ngày bay không được nằm trong quá khứ
        if(flightDTO.getCheckInDate().before(new Date())){
            throw new AppException(ErrorCode.DATE_NOT_VALID);
        }
        // Validation 2: Ngày bay phải trước ngày hạ cánh
        if(!flightDTO.getCheckInDate().before(flightDTO.getCheckOutDate())){
            throw new IllegalArgumentException(String.valueOf(ErrorCode.DATE_TIME_NOT_VALID));
        }

        // Mapping: Chuyển dữ liệu từ DTO sang Entity
        Flight flight = new Flight();

        flight.setDepartureLocation(flightDTO.getDepartureLocation()); // Thêm điểm đi
        flight.setArrivalLocation(flightDTO.getArrivalLocation());     // Thêm điểm đến

        flight.setTicketClass(flightDTO.getTicketClass());
        flight.setAirlineName(flightDTO.getAirlineName());
        flight.setPrice(flightDTO.getPrice());
        flight.setCheckInDate(flightDTO.getCheckInDate());
        flight.setCheckOutDate(flightDTO.getCheckOutDate());
        flight.setNumberOfChairs(flightDTO.getNumberOfChairs());

        // Logic cũ: Khi mới tạo, chưa ai đặt vé -> Số ghế trống = Tổng số ghế
        flight.setSeatAvailable(flightDTO.getNumberOfChairs());

        return flightRepository.save(flight);
    }

    // --- 2. XÓA CHUYẾN BAY (GIỮ NGUYÊN) ---
    @Override
    @Transactional
    public void deleteFlight(Long id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FLIGHT_NOT_FOUND));

        List<Order> orders = orderRepository.findByFlight(flight);
        for(Order order : orders){
            order.setFlight(null);
        }
        orderRepository.saveAll(orders);

        flightRepository.delete(flight);
    }

    // --- 3. CẬP NHẬT CHUYẾN BAY (GIỮ NGUYÊN) ---
    @Override
    public Flight updateFlight(Long id, FlightDTO flightDTO) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_EXISTS));

        if(flightDTO.getCheckInDate().before(new Date())){
            throw new AppException(ErrorCode.DATE_NOT_VALID);
        }
        if(!flightDTO.getCheckInDate().before(flightDTO.getCheckOutDate())){
            throw new IllegalArgumentException(String.valueOf(ErrorCode.DATE_TIME_NOT_VALID));
        }

        // --- LOGIC TÍNH TOÁN LẠI SỐ GHẾ ---
        if(flightDTO.getNumberOfChairs() >= flight.getNumberOfChairs()){
            // Tăng thêm ghế
            flight.setSeatAvailable(flight.getSeatAvailable() + flightDTO.getNumberOfChairs() - flight.getNumberOfChairs());
        } else {
            // Giảm bớt ghế
            int soGheDaDuocDat = flight.getNumberOfChairs() - flight.getSeatAvailable();
            if(flightDTO.getNumberOfChairs() < soGheDaDuocDat){
                throw new AppException(ErrorCode.NUMBER_CHAIR_NOT_VALID);
            } else {
                flight.setSeatAvailable(flightDTO.getNumberOfChairs() - soGheDaDuocDat);
            }
        }

        // Cập nhật các thông tin
        flight.setDepartureLocation(flightDTO.getDepartureLocation()); // Cập nhật điểm đi
        flight.setArrivalLocation(flightDTO.getArrivalLocation());     // Cập nhật điểm đến

        flight.setTicketClass(flightDTO.getTicketClass());
        flight.setAirlineName(flightDTO.getAirlineName());
        flight.setPrice(flightDTO.getPrice());
        flight.setCheckInDate(flightDTO.getCheckInDate());
        flight.setCheckOutDate(flightDTO.getCheckOutDate());
        flight.setNumberOfChairs(flightDTO.getNumberOfChairs());

        return flightRepository.save(flight);
    }

    // --- 4. LẤY TẤT CẢ (GIỮ NGUYÊN) ---
    @Override
    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }

    // --- 5. GỢI Ý CHUYẾN BAY (MỚI THÊM VÀO) ---
    // Hàm này override từ Interface FlightService vừa sửa
    @Override
    public List<Flight> getSuggestedFlights(String fromLocation, String toLocation) {
        // Gọi xuống Repository để tìm những chuyến bay khớp địa điểm và chưa bay
        return flightRepository.findSuggestedFlights(fromLocation, toLocation);
    }
}