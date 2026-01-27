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

    // --- 1. TẠO CHUYẾN BAY ---
    @Override
    public Flight createFlight(FlightDTO flightDTO) {
        // [GIỮ NGUYÊN] Validation: Ngày bay không được nằm trong quá khứ
        if(flightDTO.getCheckInDate().before(new Date())){
            throw new AppException(ErrorCode.DATE_NOT_VALID);
        }

        // [THAY ĐỔI DUY NHẤT Ở ĐÂY]
        if(flightDTO.getCheckOutDate().before(flightDTO.getCheckInDate())){
            throw new IllegalArgumentException(String.valueOf(ErrorCode.DATE_TIME_NOT_VALID));
        }

        Flight flight = new Flight();
        flight.setDepartureLocation(flightDTO.getDepartureLocation());
        flight.setArrivalLocation(flightDTO.getArrivalLocation());
        flight.setTicketClass(flightDTO.getTicketClass());
        flight.setAirlineName(flightDTO.getAirlineName());
        flight.setPrice(flightDTO.getPrice());
        flight.setCheckInDate(flightDTO.getCheckInDate());
        flight.setCheckOutDate(flightDTO.getCheckOutDate());
        flight.setNumberOfChairs(flightDTO.getNumberOfChairs());

        // [GIỮ NGUYÊN] Logic set ghế trống ban đầu = tổng số ghế
        flight.setSeatAvailable(flightDTO.getNumberOfChairs());

        return flightRepository.save(flight);
    }

    // --- 2. XÓA CHUYẾN BAY (GIỮ NGUYÊN HOÀN TOÀN) ---
    // --- 2. XÓA CHUYẾN BAY ---
    @Override
    @Transactional
    public void deleteFlight(Long id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FLIGHT_NOT_FOUND));

        // [LOGIC MỚI] Kiểm tra xem chuyến bay đã có đơn hàng nào chưa
        List<Order> orders = orderRepository.findByFlight(flight);

        // Nếu danh sách đơn hàng không rỗng -> Có người đã đặt
        if (orders != null && !orders.isEmpty()) {
            throw new AppException(ErrorCode.CANNOT_DELETE_BOOKED_FLIGHT);
        }

        // Nếu chưa có ai đặt -> Xóa thoải mái
        flightRepository.delete(flight);
    }

    // --- 3. CẬP NHẬT CHUYẾN BAY ---
    @Override
    public Flight updateFlight(Long id, FlightDTO flightDTO) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_EXISTS));

        // 1. Validation ngày quá khứ (GIỮ NGUYÊN)
        if(flightDTO.getCheckInDate().before(new Date())){
            throw new AppException(ErrorCode.DATE_NOT_VALID);
        }

        // 2. Validation ngày về trước ngày đi (GIỮ NGUYÊN)
        if(flightDTO.getCheckOutDate().before(flightDTO.getCheckInDate())){
            throw new IllegalArgumentException(String.valueOf(ErrorCode.DATE_TIME_NOT_VALID));
        }

        // --- [LOGIC MỚI BẮT ĐẦU TỪ ĐÂY] ---

        // Tính số ghế đã được đặt
        int soGheDaDuocDat = flight.getNumberOfChairs() - flight.getSeatAvailable();

        // NẾU ĐÃ CÓ NGƯỜI ĐẶT VÉ (soGheDaDuocDat > 0)
        if (soGheDaDuocDat > 0) {
            // Kiểm tra xem Admin có đang cố thay đổi thông tin nhạy cảm không?
            // Lưu ý: So sánh Date và String cần dùng .equals hoặc .compareTo
            boolean isChangingDate = flight.getCheckInDate().compareTo(flightDTO.getCheckInDate()) != 0
                    || flight.getCheckOutDate().compareTo(flightDTO.getCheckOutDate()) != 0;

            boolean isChangingLocation = !flight.getDepartureLocation().equals(flightDTO.getDepartureLocation())
                    || !flight.getArrivalLocation().equals(flightDTO.getArrivalLocation());

            if (isChangingDate || isChangingLocation) {
                throw new AppException(ErrorCode.CANNOT_UPDATE_BOOKED_FLIGHT);
            }
        }
        // --- [KẾT THÚC LOGIC MỚI] ---

        // 3. Logic tính toán lại số ghế (GIỮ NGUYÊN)
        if(flightDTO.getNumberOfChairs() >= flight.getNumberOfChairs()){
            // Tăng tổng số ghế -> cộng thêm vào ghế trống
            flight.setSeatAvailable(flight.getSeatAvailable() + flightDTO.getNumberOfChairs() - flight.getNumberOfChairs());
        } else {
            // Giảm tổng số ghế -> kiểm tra xem có vi phạm số ghế đã đặt không
            // (Biến soGheDaDuocDat đã tính ở trên rồi, tận dụng lại)
            if(flightDTO.getNumberOfChairs() < soGheDaDuocDat){
                throw new AppException(ErrorCode.NUMBER_CHAIR_NOT_VALID);
            } else {
                flight.setSeatAvailable(flightDTO.getNumberOfChairs() - soGheDaDuocDat);
            }
        }

        // Cập nhật thông tin
        flight.setDepartureLocation(flightDTO.getDepartureLocation());
        flight.setArrivalLocation(flightDTO.getArrivalLocation());
        flight.setTicketClass(flightDTO.getTicketClass()); // Hạng vé có thể cho đổi hoặc chặn tùy bạn
        flight.setAirlineName(flightDTO.getAirlineName());
        flight.setPrice(flightDTO.getPrice()); // Giá vé thường cho phép đổi (áp dụng cho người mua sau)
        flight.setCheckInDate(flightDTO.getCheckInDate());
        flight.setCheckOutDate(flightDTO.getCheckOutDate());
        flight.setNumberOfChairs(flightDTO.getNumberOfChairs());

        return flightRepository.save(flight);
    }

    // --- 4. CÁC HÀM GET (GIỮ NGUYÊN) ---
    @Override
    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }

    @Override
    public List<Flight> getSuggestedFlights(String fromLocation, String toLocation) {
        return flightRepository.findSuggestedFlights(fromLocation, toLocation);
    }
}