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
    private FlightRepository flightRepository; // Để thao tác với bảng Flight

    @Autowired
    private OrderRepository orderRepository;   // Để thao tác với bảng Order (cần khi xóa chuyến bay)

    // --- 1. TẠO CHUYẾN BAY MỚI ---
    @Override
    public Flight createFlight(FlightDTO flightDTO) {
        // Validation 1: Ngày bay không được nằm trong quá khứ
        if(flightDTO.getCheckInDate().before(new Date())){
            throw new AppException(ErrorCode.DATE_NOT_VALID);
        }
        // Validation 2: Ngày bay phải trước ngày hạ cánh
        if(!flightDTO.getCheckInDate().before(flightDTO.getCheckOutDate())){
            // Chỗ này bạn đang dùng IllegalArgumentException,
            // nên đồng bộ dùng AppException cho chuẩn format lỗi chung của dự án.
            throw new IllegalArgumentException(String.valueOf(ErrorCode.DATE_TIME_NOT_VALID));
        }

        // Mapping: Chuyển dữ liệu từ DTO sang Entity thủ công
        Flight flight = new Flight();
        flight.setTicketClass(flightDTO.getTicketClass());
        flight.setAirlineName(flightDTO.getAirlineName());
        flight.setPrice(flightDTO.getPrice());
        flight.setCheckInDate(flightDTO.getCheckInDate());
        flight.setCheckOutDate(flightDTO.getCheckOutDate());
        flight.setNumberOfChairs(flightDTO.getNumberOfChairs()); // Tổng số ghế

        // Logic quan trọng: Khi mới tạo, chưa ai đặt vé -> Số ghế trống = Tổng số ghế
        flight.setSeatAvailable(flightDTO.getNumberOfChairs());

        return flightRepository.save(flight);
    }

    // --- 2. XÓA CHUYẾN BAY ---
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

    // --- 3. CẬP NHẬT CHUYẾN BAY ---
    @Override
    public Flight updateFlight(Long id, FlightDTO flightDTO) {
        // Kiểm tra xem chuyến bay có tồn tại không
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_EXISTS));

        // Validation ngày tháng (Giống phần Create)
        if(flightDTO.getCheckInDate().before(new Date())){
            throw new AppException(ErrorCode.DATE_NOT_VALID);
        }
        if(!flightDTO.getCheckInDate().before(flightDTO.getCheckOutDate())){
            throw new IllegalArgumentException(String.valueOf(ErrorCode.DATE_TIME_NOT_VALID));
        }

        // --- LOGIC TÍNH TOÁN LẠI SỐ GHẾ (Phức tạp nhất) ---
        // flight.getNumberOfChairs(): Tổng ghế CŨ
        // flightDTO.getNumberOfChairs(): Tổng ghế MỚI

        if(flightDTO.getNumberOfChairs() >= flight.getNumberOfChairs()){
            // TRƯỜNG HỢP 1: Tăng thêm ghế (hoặc bằng)
            // Ghế trống mới = Ghế trống cũ + (Số lượng tăng thêm)
            flight.setSeatAvailable(flight.getSeatAvailable() + flightDTO.getNumberOfChairs() - flight.getNumberOfChairs());
        } else {
            // TRƯỜNG HỢP 2: Giảm bớt ghế
            // Tính số ghế ĐÃ BÁN = Tổng cũ - Trống cũ
            int soGheDaDuocDat = flight.getNumberOfChairs() - flight.getSeatAvailable();

            // Nếu Tổng ghế MỚI < Số ghế ĐÃ BÁN -> Vô lý (Không thể ép khách xuống máy bay) -> Báo lỗi
            if(flightDTO.getNumberOfChairs() < soGheDaDuocDat){
                throw new AppException(ErrorCode.NUMBER_CHAIR_NOT_VALID);
            } else {
                // Nếu hợp lệ: Ghế trống mới = Tổng mới - Đã bán
                flight.setSeatAvailable(flightDTO.getNumberOfChairs() - soGheDaDuocDat);
            }
        }

        // Cập nhật các thông tin còn lại
        flight.setTicketClass(flightDTO.getTicketClass());
        flight.setAirlineName(flightDTO.getAirlineName());
        flight.setPrice(flightDTO.getPrice());
        flight.setCheckInDate(flightDTO.getCheckInDate());
        flight.setCheckOutDate(flightDTO.getCheckOutDate());
        flight.setNumberOfChairs(flightDTO.getNumberOfChairs());

        return flightRepository.save(flight);
    }

    // --- 4. LẤY TẤT CẢ ---
    @Override
    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }
}