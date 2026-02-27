package com.java.web_travel.service.impl;

import com.java.web_travel.entity.Airline;
import com.java.web_travel.entity.Flight;
import com.java.web_travel.entity.Order;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.FlightDTO;
import com.java.web_travel.repository.AirlineRepository;
import com.java.web_travel.repository.FlightRepository;
import com.java.web_travel.repository.OrderRepository;
import com.java.web_travel.service.FlightService;
// 👉 [MỚI]: Import thêm Entity và Repository của lịch sử giá
import com.java.web_travel.entity.FlightPriceHistory;
import com.java.web_travel.repository.FlightPriceHistoryRepository;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList; // 👉 [MỚI]
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FlightServiceImpl implements FlightService {

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AirlineRepository airlineRepository;

    // 👉 [MỚI]: Inject Repository Lịch sử giá
    @Autowired
    private FlightPriceHistoryRepository priceHistoryRepository;

    // --- 1. TẠO CHUYẾN BAY ---
    @Override
    public Flight createFlight(FlightDTO flightDTO) {
        // Validation ngày (GIỮ NGUYÊN)
        if(flightDTO.getCheckInDate().before(new Date())){
            throw new AppException(ErrorCode.DATE_NOT_VALID);
        }

        if(flightDTO.getCheckOutDate().before(flightDTO.getCheckInDate())){
            throw new IllegalArgumentException(String.valueOf(ErrorCode.DATE_TIME_NOT_VALID));
        }

        Airline airline = airlineRepository.findById(flightDTO.getAirlineId())
                .orElseThrow(() -> new AppException(ErrorCode.AIRLINE_NOT_FOUND));

        if (airline.isDeleted()) {
            throw new AppException(ErrorCode.AIRLINE_IS_DELETED);
        }

        Flight flight = new Flight();

        flight.setAirline(airline);
        flight.setAirplaneName(flightDTO.getAirplaneName());
        flight.setDepartureLocation(flightDTO.getDepartureLocation());
        flight.setArrivalLocation(flightDTO.getArrivalLocation());
        flight.setTicketClass(flightDTO.getTicketClass());
        flight.setPrice(flightDTO.getPrice());
        flight.setCheckInDate(flightDTO.getCheckInDate());
        flight.setCheckOutDate(flightDTO.getCheckOutDate());
        flight.setNumberOfChairs(flightDTO.getNumberOfChairs());
        flight.setSeatAvailable(flightDTO.getNumberOfChairs());
        flight.setDeleted(false);

        return flightRepository.save(flight);
    }

    // --- 2. XÓA CHUYẾN BAY ---
    @Override
    @Transactional
    public void deleteFlight(Long id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FLIGHT_NOT_FOUND));

        // 👉 [LOGIC MỚI CÁCH 1]: Chặn Admin xóa chuyến bay đã cất cánh
        if (flight.getCheckInDate().before(new Date())) {
            // Bạn cần thêm CANNOT_DELETE_PAST_FLIGHT vào Enum ErrorCode của bạn nhé
            // Ví dụ message: "Không thể xóa chuyến bay đã khởi hành để đảm bảo lưu trữ lịch sử."
            throw new AppException(ErrorCode.CANNOT_DELETE_PAST_FLIGHT);
        }

        List<Order> orders = orderRepository.findByFlight(flight);

        if (orders != null && !orders.isEmpty()) {
            for (Order order : orders) {
                if (!"CANCELLED".equalsIgnoreCase(order.getStatus().name()))  {
                    throw new AppException(ErrorCode.CANNOT_DELETE_BOOKED_FLIGHT);
                }
            }
        }

        flight.setDeleted(true);
        flightRepository.save(flight);
    }

    // --- 3. CẬP NHẬT CHUYẾN BAY ---
    @Override
    public Flight updateFlight(Long id, FlightDTO flightDTO) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_EXISTS));

        if (flight.isDeleted()) {
            throw new AppException(ErrorCode.FLIGHT_NOT_FOUND);
        }

        // 👉 [LOGIC MỚI CÁCH 1]: Chặn Admin sửa thông tin chuyến bay đã cất cánh
        if (flight.getCheckInDate().before(new Date())) {
            // Bạn cần thêm CANNOT_UPDATE_PAST_FLIGHT vào Enum ErrorCode của bạn nhé
            // Ví dụ message: "Không thể cập nhật thông tin của chuyến bay đã khởi hành."
            throw new AppException(ErrorCode.CANNOT_UPDATE_PAST_FLIGHT);
        }

        // Validation ngày (GIỮ NGUYÊN)
        if(flightDTO.getCheckInDate().before(new Date())){
            throw new AppException(ErrorCode.DATE_NOT_VALID);
        }
        if(flightDTO.getCheckOutDate().before(flightDTO.getCheckInDate())){
            throw new IllegalArgumentException(String.valueOf(ErrorCode.DATE_TIME_NOT_VALID));
        }

        Airline newAirline = airlineRepository.findById(flightDTO.getAirlineId())
                .orElseThrow(() -> new AppException(ErrorCode.AIRLINE_NOT_FOUND));

        if (newAirline.isDeleted()) {
            throw new AppException(ErrorCode.AIRLINE_IS_DELETED);
        }

        int soGheDaDuocDat = flight.getNumberOfChairs() - flight.getSeatAvailable();

        if (soGheDaDuocDat > 0) {
            boolean isChangingDate = flight.getCheckInDate().compareTo(flightDTO.getCheckInDate()) != 0
                    || flight.getCheckOutDate().compareTo(flightDTO.getCheckOutDate()) != 0;

            boolean isChangingLocation = !flight.getDepartureLocation().equals(flightDTO.getDepartureLocation())
                    || !flight.getArrivalLocation().equals(flightDTO.getArrivalLocation());

            boolean isChangingAirline = !flight.getAirline().getId().equals(newAirline.getId());

            if (isChangingDate || isChangingLocation || isChangingAirline) {
                throw new AppException(ErrorCode.CANNOT_UPDATE_BOOKED_FLIGHT);
            }
        }

        if(flightDTO.getNumberOfChairs() >= flight.getNumberOfChairs()){
            flight.setSeatAvailable(flight.getSeatAvailable() + flightDTO.getNumberOfChairs() - flight.getNumberOfChairs());
        } else {
            if(flightDTO.getNumberOfChairs() < soGheDaDuocDat){
                throw new AppException(ErrorCode.NUMBER_CHAIR_NOT_VALID);
            } else {
                flight.setSeatAvailable(flightDTO.getNumberOfChairs() - soGheDaDuocDat);
            }
        }

        // 👉 [MỚI]: Kiểm tra xem giá vé có thay đổi không? Nếu có thì lưu vào bảng lịch sử
        double oldPrice = flight.getPrice();
        double newPrice = flightDTO.getPrice();

        if (oldPrice != newPrice) {
            FlightPriceHistory history = new FlightPriceHistory();
            history.setFlight(flight);
            history.setOldPrice(oldPrice);
            history.setNewPrice(newPrice);
            history.setChangedAt(new Date());
            priceHistoryRepository.save(history); // Lưu dòng lịch sử
        }

        flight.setAirline(newAirline);
        flight.setAirplaneName(flightDTO.getAirplaneName());
        flight.setDepartureLocation(flightDTO.getDepartureLocation());
        flight.setArrivalLocation(flightDTO.getArrivalLocation());
        flight.setTicketClass(flightDTO.getTicketClass());
        flight.setPrice(newPrice); // Đã dùng biến newPrice
        flight.setCheckInDate(flightDTO.getCheckInDate());
        flight.setCheckOutDate(flightDTO.getCheckOutDate());
        flight.setNumberOfChairs(flightDTO.getNumberOfChairs());

        return flightRepository.save(flight);
    }

    // --- 4. CÁC HÀM GET ---

    // 👉 Hàm này dùng cho ADMIN: Lấy tất cả chuyến bay (kể cả đã bay) để quản lý lịch sử
    @Override
    public List<Flight> getAllFlights() {
        return flightRepository.findByDeletedFalse();
    }

    // 👉 [LOGIC MỚI CÁCH 1] Hàm này dùng cho KHÁCH HÀNG (Người dùng end-user):
    // Chỉ hiển thị các chuyến bay ở Tương Lai (Chưa bay)
    @Override
    public List<Flight> getUpcomingFlightsForUser() {
        Date now = new Date();
        // Lấy danh sách chưa xóa -> Dùng Stream để lọc những chuyến có ngày cất cánh > ngày hiện tại
        return flightRepository.findByDeletedFalse().stream()
                .filter(flight -> flight.getCheckInDate().after(now))
                .collect(Collectors.toList());
    }

    @Override
    public List<Flight> getSuggestedFlights(String fromLocation, String toLocation) {
        return flightRepository.findSuggestedFlights(fromLocation, toLocation);
    }

    // --- 5. LẤY DANH SÁCH CHUYẾN BAY TRONG THÙNG RÁC ---
    @Override
    public List<Flight> getDeletedFlights() {
        return flightRepository.findByDeletedTrue();
    }

    // --- 6. KHÔI PHỤC CHUYẾN BAY ĐÃ XÓA ---
    @Override
    public Flight restoreFlight(Long id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FLIGHT_NOT_FOUND));

        if (flight.getAirline() != null && flight.getAirline().isDeleted()) {
            throw new AppException(ErrorCode.AIRLINE_IS_DELETED);
        }

        flight.setDeleted(false);

        return flightRepository.save(flight);
    }

    // --- 7. TẠO NHIỀU CHUYẾN BAY CÙNG LÚC CHO 1 HÃNG (LOGIC MỚI THÊM) ---
    @Override
    @Transactional
    public List<Flight> createMultipleFlights(Long airlineId, List<FlightDTO> flightDTOs) {

        // 1. Chặn List rỗng
        if (flightDTOs == null || flightDTOs.isEmpty()) {
            throw new AppException(ErrorCode.ARGUMENT_NOT_VALID); // Thêm ErrorCode báo list rỗng
        }

        // 2. Chặn tạo quá nhiều (Ví dụ max 50 chuyến)
        if (flightDTOs.size() > 50) {
            throw new AppException(ErrorCode.ARGUMENT_NOT_VALID); // Báo lỗi vượt quá số lượng
        }

        Airline airline = airlineRepository.findById(airlineId)
                .orElseThrow(() -> new AppException(ErrorCode.AIRLINE_NOT_FOUND));

        if (airline.isDeleted()) {
            throw new AppException(ErrorCode.AIRLINE_IS_DELETED);
        }

        // 3. Kiểm tra đụng giờ NGAY TRONG mảng JSON gửi lên (RAM)
        // Sắp xếp danh sách theo tên máy bay và thời gian cất cánh để dễ kiểm tra
        flightDTOs.sort((f1, f2) -> {
            int nameCompare = f1.getAirplaneName().compareTo(f2.getAirplaneName());
            if (nameCompare != 0) return nameCompare;
            return f1.getCheckInDate().compareTo(f2.getCheckInDate());
        });

        // Duyệt qua từng cặp chuyến bay liền kề
        for (int i = 0; i < flightDTOs.size() - 1; i++) {
            FlightDTO current = flightDTOs.get(i);
            FlightDTO next = flightDTOs.get(i + 1);

            // Nếu cùng một máy bay...
            if (current.getAirplaneName().equalsIgnoreCase(next.getAirplaneName())) {
                // ...mà chuyến sau lại cất cánh TRƯỚC KHI chuyến trước kịp hạ cánh -> Đụng giờ!
                if (next.getCheckInDate().before(current.getCheckOutDate())) {
                    throw new AppException(ErrorCode.DUPLICATE_DATA);
                }
            }
        }

        List<Flight> flightsToSave = flightDTOs.stream().map(dto -> {
            // 4. Validate Điểm đi trùng Điểm đến
            if (dto.getDepartureLocation().trim().equalsIgnoreCase(dto.getArrivalLocation().trim())) {
                throw new AppException(ErrorCode.LOCATION_NOT_VALID); // Thêm ErrorCode này
            }

            if (dto.getCheckInDate().before(new Date())) {
                throw new AppException(ErrorCode.DATE_NOT_VALID);
            }
            if (dto.getCheckOutDate().before(dto.getCheckInDate())) {
                throw new IllegalArgumentException(String.valueOf(ErrorCode.DATE_TIME_NOT_VALID));
            }

            // 5. Query xuống Database để kiểm tra trùng lịch bay
            boolean isOverlapping = flightRepository.existsOverlappingFlight(
                    dto.getAirplaneName(),
                    dto.getCheckInDate(),
                    dto.getCheckOutDate()
            );

            if (isOverlapping) {
                // Ném lỗi nếu máy bay đã có chuyến bay khác trong khoảng thời gian này
                throw new AppException(ErrorCode.DUPLICATE_DATA);
            }

            Flight flight = new Flight();
            flight.setAirline(airline);
            flight.setAirplaneName(dto.getAirplaneName());
            flight.setDepartureLocation(dto.getDepartureLocation());
            flight.setArrivalLocation(dto.getArrivalLocation());
            flight.setTicketClass(dto.getTicketClass());
            flight.setPrice(dto.getPrice());
            flight.setCheckInDate(dto.getCheckInDate());
            flight.setCheckOutDate(dto.getCheckOutDate());
            flight.setNumberOfChairs(dto.getNumberOfChairs());
            flight.setSeatAvailable(dto.getNumberOfChairs());
            flight.setDeleted(false);

            return flight;
        }).collect(Collectors.toList());

        return flightRepository.saveAll(flightsToSave);
    }

    // --- CHỨC NĂNG: ĐIỀU CHỈNH GIÁ VĨNH VIỄN CHO CÁC CHUYẾN BAY ĐƯỢC CHỌN ---
    @Override
    @Transactional
    public void adjustPriceForSelectedFlights(List<Long> flightIds, double percentage) {
        // 1. Chặn List rỗng
        if (flightIds == null || flightIds.isEmpty()) {
            throw new AppException(ErrorCode.ARGUMENT_NOT_VALID);
        }

        // 2. Chặn Admin nhập số âm quá lớn làm giá rớt xuống dưới 0
        if (percentage <= -100) {
            throw new AppException(ErrorCode.ARGUMENT_NOT_VALID);
        }

        Date now = new Date();

        // 3. Lấy ra TẤT CẢ các chuyến bay dựa trên danh sách ID được truyền vào
        List<Flight> selectedFlights = flightRepository.findAllById(flightIds);

        // 4. Lọc bỏ các chuyến bay không hợp lệ (đã bay, hoặc đã bị xóa mềm)
        // Đây là bước bảo vệ phụ ở Backend phòng khi Frontend gửi nhầm ID rác
        List<Flight> validFlightsToUpdate = selectedFlights.stream()
                .filter(flight -> !flight.isDeleted() && flight.getCheckInDate().after(now))
                .collect(Collectors.toList());

        if (validFlightsToUpdate.isEmpty()) {
            // Không có chuyến bay hợp lệ nào để cập nhật
            return;
        }

        // 👉 [MỚI]: Tạo một danh sách để chứa các lịch sử giá cần lưu
        List<FlightPriceHistory> historyList = new ArrayList<>();

        // 5. Tính toán giá mới
        for (Flight flight : validFlightsToUpdate) {
            double currentPrice = flight.getPrice();

            double newPrice = currentPrice * (1 + (percentage / 100.0));

            if (newPrice < 0) {
                newPrice = 0;
            }

            // Làm tròn đến hàng nghìn (VD: 125.600 -> 126.000)
            newPrice = Math.round(newPrice / 1000.0) * 1000.0;

            // 👉 [MỚI]: Nếu giá thực sự thay đổi, thêm vào danh sách lịch sử
            if (currentPrice != newPrice) {
                FlightPriceHistory history = new FlightPriceHistory();
                history.setFlight(flight);
                history.setOldPrice(currentPrice);
                history.setNewPrice(newPrice);
                history.setChangedAt(new Date());
                historyList.add(history);
            }

            flight.setPrice(newPrice);
        }

        // 6. Lưu xuống Database (Lưu hàng loạt chuyến bay và lịch sử)
        flightRepository.saveAll(validFlightsToUpdate);
        priceHistoryRepository.saveAll(historyList); // 👉 [MỚI]: Lưu hàng loạt lịch sử
    }

    // --- 8. TÌM KIẾM CHUYẾN BAY (CHO ADMIN) ---
    @Override
    public List<Flight> searchFlightsForAdmin(String keyword, String departure, String arrival, Long airlineId) {
        // Chuẩn hóa chuỗi rỗng thành null để query JPQL hoạt động chính xác
        String validKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String validDeparture = (departure != null && !departure.trim().isEmpty()) ? departure.trim() : null;
        String validArrival = (arrival != null && !arrival.trim().isEmpty()) ? arrival.trim() : null;

        List<Flight> searchResults = flightRepository.searchFlightsForAdmin(validKeyword, validDeparture, validArrival, airlineId);

        // (Tùy chọn) Chỉ trả về các chuyến bay chưa cất cánh để Admin đổi giá
        Date now = new Date();
        return searchResults.stream()
                .filter(flight -> flight.getCheckInDate().after(now))
                .collect(Collectors.toList());
    }

    // --- 9. 👉 [MỚI] XEM LỊCH SỬ THAY ĐỔI GIÁ CỦA CHUYẾN BAY ---
    @Override
    public List<FlightPriceHistory> getFlightPriceHistory(Long flightId) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new AppException(ErrorCode.FLIGHT_NOT_FOUND));

        return priceHistoryRepository.findByFlightOrderByChangedAtDesc(flight);
    }
}