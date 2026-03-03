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

import com.java.web_travel.entity.FlightPriceHistory;
import com.java.web_travel.repository.FlightPriceHistoryRepository;

import com.java.web_travel.entity.FlightHolidayPolicy;
import com.java.web_travel.repository.FlightHolidayPolicyRepository;
import com.java.web_travel.model.request.AddPolicyToFlightsRequest;
import java.time.LocalDate;
import java.time.ZoneId;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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

    @Autowired
    private FlightPriceHistoryRepository priceHistoryRepository;

    @Autowired
    private FlightHolidayPolicyRepository flightHolidayPolicyRepository;


    private Double smartRoundPrice(Double rawPrice) {
        if (rawPrice == null) return 0.0;
        double rounded = Math.round(rawPrice / 1000.0) * 1000.0;
        return rounded < 0 ? 0.0 : rounded;
    }

    private void applyDynamicPriceToFlight(Flight flight) {
        if (flight.getCheckInDate() == null) return;

        LocalDate departureDate = flight.getCheckInDate().toInstant()
                .atZone(ZoneId.systemDefault()).toLocalDate();

        List<FlightHolidayPolicy> activePolicies = flightHolidayPolicyRepository
                .findPoliciesCoveringDate(departureDate);

        if (!activePolicies.isEmpty()) {
            FlightHolidayPolicy maxPolicy = activePolicies.stream()
                    .max((p1, p2) -> p1.getIncreasePercentage().compareTo(p2.getIncreasePercentage()))
                    .orElse(activePolicies.get(0));

            double rate = 1.0 + (maxPolicy.getIncreasePercentage() / 100.0);

            flight.setPrice(smartRoundPrice(flight.getPrice() * rate));
        }
    }


    @Override
    public Flight createFlight(FlightDTO flightDTO) {
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

    @Override
    @Transactional
    public void deleteFlight(Long id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FLIGHT_NOT_FOUND));

        if (flight.getCheckInDate().before(new Date())) {
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

    @Override
    public Flight updateFlight(Long id, FlightDTO flightDTO) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_EXISTS));

        if (flight.isDeleted()) {
            throw new AppException(ErrorCode.FLIGHT_NOT_FOUND);
        }

        if (flight.getCheckInDate().before(new Date())) {
            throw new AppException(ErrorCode.CANNOT_UPDATE_PAST_FLIGHT);
        }

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

        double oldPrice = flight.getPrice();
        double newPrice = flightDTO.getPrice();

        if (oldPrice != newPrice) {
            FlightPriceHistory history = new FlightPriceHistory();
            history.setFlight(flight);
            history.setOldPrice(oldPrice);
            history.setNewPrice(newPrice);
            history.setChangedAt(new Date());
            priceHistoryRepository.save(history);
        }

        flight.setAirline(newAirline);
        flight.setAirplaneName(flightDTO.getAirplaneName());
        flight.setDepartureLocation(flightDTO.getDepartureLocation());
        flight.setArrivalLocation(flightDTO.getArrivalLocation());
        flight.setTicketClass(flightDTO.getTicketClass());
        flight.setPrice(newPrice);
        flight.setCheckInDate(flightDTO.getCheckInDate());
        flight.setCheckOutDate(flightDTO.getCheckOutDate());
        flight.setNumberOfChairs(flightDTO.getNumberOfChairs());

        return flightRepository.save(flight);
    }

    @Override
    public List<Flight> getAllFlights() {
        List<Flight> flights = flightRepository.findByDeletedFalse();
        flights.forEach(this::applyDynamicPriceToFlight);
        return flights;
    }

    @Override
    public List<Flight> getUpcomingFlightsForUser() {
        Date now = new Date();
        List<Flight> flights = flightRepository.findByDeletedFalse().stream()
                .filter(flight -> flight.getCheckInDate().after(now))
                .collect(Collectors.toList());

        flights.forEach(this::applyDynamicPriceToFlight);
        return flights;
    }

    @Override
    public List<Flight> getSuggestedFlights(String fromLocation, String toLocation) {
        List<Flight> flights = flightRepository.findSuggestedFlights(fromLocation, toLocation);

        flights.forEach(this::applyDynamicPriceToFlight);
        return flights;
    }

    @Override
    public List<Flight> getDeletedFlights() {
        return flightRepository.findByDeletedTrue();
    }

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

    @Override
    @Transactional
    public List<Flight> createMultipleFlights(Long airlineId, List<FlightDTO> flightDTOs) {

        if (flightDTOs == null || flightDTOs.isEmpty()) {
            throw new AppException(ErrorCode.ARGUMENT_NOT_VALID);
        }

        if (flightDTOs.size() > 50) {
            throw new AppException(ErrorCode.ARGUMENT_NOT_VALID);
        }

        Airline airline = airlineRepository.findById(airlineId)
                .orElseThrow(() -> new AppException(ErrorCode.AIRLINE_NOT_FOUND));

        if (airline.isDeleted()) {
            throw new AppException(ErrorCode.AIRLINE_IS_DELETED);
        }

        flightDTOs.sort((f1, f2) -> {
            int nameCompare = f1.getAirplaneName().compareTo(f2.getAirplaneName());
            if (nameCompare != 0) return nameCompare;
            return f1.getCheckInDate().compareTo(f2.getCheckInDate());
        });

        for (int i = 0; i < flightDTOs.size() - 1; i++) {
            FlightDTO current = flightDTOs.get(i);
            FlightDTO next = flightDTOs.get(i + 1);

            if (current.getAirplaneName().equalsIgnoreCase(next.getAirplaneName())) {
                if (next.getCheckInDate().before(current.getCheckOutDate())) {
                    throw new AppException(ErrorCode.DUPLICATE_DATA);
                }
            }
        }

        List<Flight> flightsToSave = flightDTOs.stream().map(dto -> {
            if (dto.getDepartureLocation().trim().equalsIgnoreCase(dto.getArrivalLocation().trim())) {
                throw new AppException(ErrorCode.LOCATION_NOT_VALID);
            }

            if (dto.getCheckInDate().before(new Date())) {
                throw new AppException(ErrorCode.DATE_NOT_VALID);
            }
            if (dto.getCheckOutDate().before(dto.getCheckInDate())) {
                throw new IllegalArgumentException(String.valueOf(ErrorCode.DATE_TIME_NOT_VALID));
            }

            boolean isOverlapping = flightRepository.existsOverlappingFlight(
                    dto.getAirplaneName(),
                    dto.getCheckInDate(),
                    dto.getCheckOutDate()
            );

            if (isOverlapping) {
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

    @Override
    @Transactional
    public void adjustPriceForSelectedFlights(List<Long> flightIds, double percentage) {
        if (flightIds == null || flightIds.isEmpty()) {
            throw new AppException(ErrorCode.ARGUMENT_NOT_VALID);
        }

        if (percentage <= -100) {
            throw new AppException(ErrorCode.ARGUMENT_NOT_VALID);
        }

        Date now = new Date();

        List<Flight> selectedFlights = flightRepository.findAllById(flightIds);

        List<Flight> validFlightsToUpdate = new ArrayList<>();
        for (Flight flight : selectedFlights) {
            if (flight.isDeleted()) {
                throw new AppException(ErrorCode.FLIGHT_NOT_FOUND);
            }

            if (flight.getCheckInDate().before(now)) {
                throw new AppException(ErrorCode.CANNOT_UPDATE_PAST_FLIGHT);
            }

            validFlightsToUpdate.add(flight);
        }

        if (validFlightsToUpdate.isEmpty()) {
            return;
        }

        List<FlightPriceHistory> historyList = new ArrayList<>();

        for (Flight flight : validFlightsToUpdate) {
            double currentPrice = flight.getPrice();

            double newPrice = currentPrice * (1 + (percentage / 100.0));

            if (newPrice < 0) {
                newPrice = 0;
            }

            newPrice = Math.round(newPrice / 1000.0) * 1000.0;

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

        flightRepository.saveAll(validFlightsToUpdate);
        priceHistoryRepository.saveAll(historyList);
    }

    // 👉 [ĐÃ FIX]: Bỏ việc lọc (filter) chuyến bay trong quá khứ ở hàm hiển thị
    @Override
    public List<Flight> searchFlightsForAdmin(String keyword, String departure, String arrival, Long airlineId) {
        String validKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String validDeparture = (departure != null && !departure.trim().isEmpty()) ? departure.trim() : null;
        String validArrival = (arrival != null && !arrival.trim().isEmpty()) ? arrival.trim() : null;

        // Trả về toàn bộ dữ liệu do Database query được, KHÔNG LỌC BỎ CÁC CHUYẾN BAY CŨ NỮA
        List<Flight> searchResults = flightRepository.searchFlightsForAdmin(validKeyword, validDeparture, validArrival, airlineId);

        // Áp dụng tính giá động (nếu có chính sách nào đang chạy) cho toàn bộ danh sách hiển thị
        searchResults.forEach(this::applyDynamicPriceToFlight);

        return searchResults;
    }

    @Override
    public List<FlightPriceHistory> getFlightPriceHistory(Long flightId) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new AppException(ErrorCode.FLIGHT_NOT_FOUND));

        return priceHistoryRepository.findByFlightOrderByChangedAtDesc(flight);
    }

    // --- 10. THÊM CHÍNH SÁCH GIÁ DỊP LỄ TOÀN CỤC ---
    @Override
    @Transactional
    public void addPolicyToSelectedFlights(AddPolicyToFlightsRequest request) {
        if (request.getPercentage() == null) {
            throw new RuntimeException("Chưa nhập phần trăm tăng/giảm!");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new RuntimeException("Ngày bắt đầu và kết thúc không được để trống!");
        }
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new RuntimeException("Lỗi: Ngày bắt đầu không được nằm sau ngày kết thúc!");
        }

        boolean existsOverlap = flightHolidayPolicyRepository.existsOverlappingPolicy(
                request.getStartDate(),
                request.getEndDate()
        );

        if (existsOverlap) {
            throw new RuntimeException("Lỗi: Khoảng thời gian từ " + request.getStartDate() +
                    " đến " + request.getEndDate() + " đã bị trùng lặp với một chính sách giá khác!");
        }

        FlightHolidayPolicy policy = new FlightHolidayPolicy();
        policy.setName(request.getPolicyName());
        policy.setStartDate(request.getStartDate());
        policy.setEndDate(request.getEndDate());
        policy.setIncreasePercentage(Double.valueOf(request.getPercentage()));

        flightHolidayPolicyRepository.save(policy);
    }

    // =========================================================================
    // --- 11. LẤY DANH SÁCH TẤT CẢ CHÍNH SÁCH LỄ / KHUYẾN MÃI ---
    // =========================================================================
    @Override
    public List<FlightHolidayPolicy> getAllHolidayPolicies() {
        return flightHolidayPolicyRepository.findAllByOrderByStartDateDesc();
    }

    // =========================================================================
    // --- 12. CẬP NHẬT CHÍNH SÁCH LỄ / KHUYẾN MÃI ---
    // =========================================================================
    @Override
    @Transactional
    public FlightHolidayPolicy updateHolidayPolicy(Long id, AddPolicyToFlightsRequest request) {
        FlightHolidayPolicy policy = flightHolidayPolicyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chính sách giá này!"));

        if (request.getPercentage() == null) {
            throw new RuntimeException("Chưa nhập phần trăm tăng/giảm!");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new RuntimeException("Ngày bắt đầu và kết thúc không được để trống!");
        }
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new RuntimeException("Lỗi: Ngày bắt đầu không được nằm sau ngày kết thúc!");
        }

        // Kiểm tra trùng lặp ngày, nhưng bỏ qua ID của chính sách đang được sửa (để tránh lỗi tự đá chính mình)
        boolean existsOverlap = flightHolidayPolicyRepository.existsOverlappingPolicyExcludingId(
                request.getStartDate(),
                request.getEndDate(),
                id
        );

        if (existsOverlap) {
            throw new RuntimeException("Lỗi: Khoảng thời gian này đã bị trùng lặp với một chính sách khác!");
        }

        policy.setName(request.getPolicyName());
        policy.setStartDate(request.getStartDate());
        policy.setEndDate(request.getEndDate());
        policy.setIncreasePercentage(Double.valueOf(request.getPercentage()));

        return flightHolidayPolicyRepository.save(policy);
    }

    // =========================================================================
    // --- 13. XÓA CHÍNH SÁCH LỄ / KHUYẾN MÃI ---
    // =========================================================================
    @Override
    @Transactional
    public void deleteHolidayPolicy(Long id) {
        FlightHolidayPolicy policy = flightHolidayPolicyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chính sách giá này!"));

        flightHolidayPolicyRepository.delete(policy);
    }
}