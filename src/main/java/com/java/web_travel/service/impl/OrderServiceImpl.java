package com.java.web_travel.service.impl;

import com.java.web_travel.entity.*;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.enums.PaymentStatus;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.OrderDTO;
import com.java.web_travel.model.request.OrderHotelDTO;
import com.java.web_travel.model.request.OrderFlightDTO;
import com.java.web_travel.model.response.PageResponse;
import com.java.web_travel.repository.*;
import com.java.web_travel.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private HotelRepository hotelRepository;
    @Autowired
    private FlightRepository flightRepository;
    @Autowired
    private SearchRepository searchRepository;
    @Autowired
    private HotelBedroomRepository hotelBedroomRepository;
    @Autowired
    private HotelBookingRepository hotelBookingRepository;
    @Autowired
    private PayRepository payRepository;
    @Autowired
    private FlightSeatRepository flightSeatRepository;

    @Autowired
    private HolidayPolicyRepository holidayPolicyRepository;

    @Autowired
    private FlightHolidayPolicyRepository flightHolidayPolicyRepository;

    // =========================================================================
    //  INTERNAL HELPERS (Hàm phụ trợ tính toán)
    // =========================================================================

    private Double smartRoundPrice(Double rawPrice) {
        if (rawPrice == null) return 0.0;
        double rounded = Math.round(rawPrice / 10000.0) * 10000.0;
        return rounded < 0 ? 0.0 : rounded;
    }

    private Date getStartOfDay(Date date) {
        if (date == null) return null;
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTime();
    }

    private HolidayPolicy getPolicyForDate(List<HolidayPolicy> policies, LocalDate date) {
        if (policies == null || policies.isEmpty()) return null;
        return policies.stream()
                .filter(p -> !date.isBefore(p.getStartDate()) && !date.isAfter(p.getEndDate()))
                .findFirst()
                .orElse(null);
    }

    private Double calculateInternalRoomPrice(Hotel hotel, HotelBedroom room, LocalDate checkIn, LocalDate checkOut) {

        Double basePrice = hotel.getHotelPriceFrom();
        if (room != null && room.getPrice() != null) {
            basePrice = room.getPrice();
        }
        if (basePrice == null) basePrice = 0.0;

        List<HolidayPolicy> groupPolicies = new ArrayList<>();
        if (hotel.getHotelGroup() != null) {
            groupPolicies = holidayPolicyRepository.findByGroupIdAndDateRange(
                    hotel.getHotelGroup().getId(), checkIn, checkOut);
        }
        List<HolidayPolicy> individualPolicies = holidayPolicyRepository.findByHotelIdAndDateRange(
                hotel.getId(), checkIn, checkOut);

        double totalAmount = 0.0;
        for (LocalDate date = checkIn; date.isBefore(checkOut); date = date.plusDays(1)) {
            double dailyPrice = basePrice;
            double increasePercent = 0.0;

            HolidayPolicy activePolicy = getPolicyForDate(groupPolicies, date);

            if (activePolicy == null) {
                activePolicy = getPolicyForDate(individualPolicies, date);
            }

            if (activePolicy != null) {
                increasePercent = activePolicy.getIncreasePercentage();
            }

            double priceToday = dailyPrice * (1.0 + (increasePercent / 100.0));
            totalAmount += priceToday;
        }

        return smartRoundPrice(totalAmount);
    }

    private Double calculateRealFlightPrice(Flight flight) {
        if (flight.getCheckInDate() == null) return flight.getPrice();

        LocalDate departureDate = flight.getCheckInDate().toInstant()
                .atZone(ZoneId.systemDefault()).toLocalDate();

        List<FlightHolidayPolicy> activePolicies = flightHolidayPolicyRepository
                .findPoliciesCoveringDate(departureDate);

        if (!activePolicies.isEmpty()) {
            FlightHolidayPolicy maxPolicy = activePolicies.stream()
                    .max((p1, p2) -> p1.getIncreasePercentage().compareTo(p2.getIncreasePercentage()))
                    .orElse(activePolicies.get(0));

            double rate = 1.0 + (maxPolicy.getIncreasePercentage() / 100.0);
            double rawPrice = flight.getPrice() * rate;

            return Math.round(rawPrice / 1000.0) * 1000.0;
        }

        return flight.getPrice();
    }

    // 👉 [MỚI]: Hàm này sẽ gán giá thực tế vào object Flight để hiển thị đúng
    private void applyDynamicPriceToOrder(Order order) {
        if (order != null && order.getFlight() != null) {
            double realPrice = calculateRealFlightPrice(order.getFlight());
            order.getFlight().setPrice(realPrice);
        }
    }

    // =========================================================================
    //  IMPLEMENTATION METHODS
    // =========================================================================

    @Override
    public Order addOrder(OrderDTO orderDTO, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

        if (orderDTO.getCurrentLocation() != null &&
                orderDTO.getDestination() != null &&
                orderDTO.getCurrentLocation().trim().equalsIgnoreCase(orderDTO.getDestination().trim())) {
            throw new RuntimeException("Điểm xuất phát và điểm đến không được trùng nhau!");
        }

        Order order = new Order();
        order.setDestination(orderDTO.getDestination());
        order.setNumberOfPeople(orderDTO.getNumberOfPeople());
        order.setCurrentLocation(orderDTO.getCurrentLocation());
        order.setUser(user);
        order.setTotalPrice(0);

        return orderRepository.save(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Order chooseHotel(Long orderId, Long hotelId, OrderHotelDTO orderHotelDTO) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if(orderHotelDTO.getStartHotel().after(orderHotelDTO.getEndHotel())){
            throw new AppException(ErrorCode.DATE_TIME_NOT_VALID);
        }

        Flight currentFlight = order.getFlight();
        if (currentFlight != null) {
            Date flightDeparture = getStartOfDay(currentFlight.getCheckInDate());
            Date hotelCheckIn = getStartOfDay(orderHotelDTO.getStartHotel());

            if (flightDeparture.after(hotelCheckIn)) {
                throw new RuntimeException("Ngày bay đi (" + currentFlight.getCheckInDate() +
                        ") không được sau ngày nhận phòng (" + orderHotelDTO.getStartHotel() + ")");
            }
        }

        int requestedRoomsCount = orderHotelDTO.getHotelBedroomList().size();
        if (requestedRoomsCount == 0) {
            throw new RuntimeException("Bạn phải chọn ít nhất 1 phòng!");
        }
        if (requestedRoomsCount > order.getNumberOfPeople()) {
            throw new RuntimeException("Số lượng phòng (" + requestedRoomsCount +
                    ") không được lớn hơn số lượng người (" + order.getNumberOfPeople() + ")!");
        }

        order.setHotel(hotel);
        order.setStartHotel(orderHotelDTO.getStartHotel());
        order.setEndHotel(orderHotelDTO.getEndHotel());

        LocalDate checkIn = orderHotelDTO.getStartHotel().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        LocalDate checkOut = orderHotelDTO.getEndHotel().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();

        StringBuilder listBedrooms = new StringBuilder();
        double totalPrice = 0;

        for(HotelBedroom bedroomRequest : orderHotelDTO.getHotelBedroomList()){
            HotelBedroom hotelBedroom = hotelBedroomRepository.findByIdWithLock(bedroomRequest.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

            List<HotelBooking> hotelBookings = hotelBookingRepository.findOverLappingBookings(
                    hotelId,
                    hotelBedroom.getId(),
                    orderHotelDTO.getStartHotel(),
                    orderHotelDTO.getEndHotel()
            );

            if(!hotelBookings.isEmpty()){
                throw new AppException(ErrorCode.HOTEL_BEDROOM_NOT_AVAILABLE);
            }

            HotelBooking hotelBooking = new HotelBooking();
            hotelBooking.setHotel(hotel);
            hotelBooking.setHotelBedroom(hotelBedroom);
            hotelBooking.setOrder(order);
            hotelBooking.setStartDate(orderHotelDTO.getStartHotel());
            hotelBooking.setEndDate(orderHotelDTO.getEndHotel());
            hotelBookingRepository.save(hotelBooking);

            listBedrooms.append(hotelBedroom.getRoomNumber()).append(" ");

            Double roomTotalAmount = calculateInternalRoomPrice(
                    hotel,
                    hotelBedroom,
                    checkIn,
                    checkOut
            );

            totalPrice += roomTotalAmount;
        }

        order.setListBedrooms(listBedrooms.toString());
        order.setTotalPrice(order.getTotalPrice() + totalPrice);
        return orderRepository.save(order);
    }

    // 👉 [ĐÃ SỬA]: Thêm (readOnly = true) và gọi hàm applyDynamicPriceToOrder
    @Override
    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        applyDynamicPriceToOrder(order);
        return order;
    }

    @Override
    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }

    @Override
    public Order chooseFlight(Long orderId , Long flightId) {
        return null;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Order chooseFlightWithSeats(Long orderId, OrderFlightDTO orderFlightDTO) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Flight flight = flightRepository.findById(orderFlightDTO.getFlightId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_EXISTS));

        Date now = new Date();
        if (flight.getCheckInDate().before(now)) {
            throw new RuntimeException("Chuyến bay này đã khởi hành vào " + flight.getCheckInDate() + ", vui lòng chọn chuyến bay khác!");
        }

        String orderDest = order.getDestination() != null ? order.getDestination().trim() : "";
        String flightDest = flight.getArrivalLocation() != null ? flight.getArrivalLocation().trim() : "";
        String orderFrom = order.getCurrentLocation() != null ? order.getCurrentLocation().trim() : "";
        String flightFrom = flight.getDepartureLocation() != null ? flight.getDepartureLocation().trim() : "";

        if (!orderDest.equalsIgnoreCase(flightDest)) {
            throw new RuntimeException("Sai lộ trình! Đơn hàng đến '" + orderDest +
                    "' nhưng chuyến bay lại đến '" + flightDest + "'");
        }
        if (!orderFrom.isEmpty() && !orderFrom.equalsIgnoreCase(flightFrom)) {
            throw new RuntimeException("Sai điểm khởi hành! Bạn đang ở '" + orderFrom +
                    "' nhưng chuyến bay lại đi từ '" + flightFrom + "'");
        }

        if (order.getStartHotel() != null && order.getEndHotel() != null) {
            Date flightDeparture = getStartOfDay(flight.getCheckInDate());
            Date hotelCheckIn = getStartOfDay(order.getStartHotel());

            if (flightDeparture.after(hotelCheckIn)) {
                throw new RuntimeException("Ngày bay đi (" + flight.getCheckInDate() +
                        ") không được sau ngày nhận phòng khách sạn (" + order.getStartHotel() + ")");
            }
        }

        List<String> requestedSeatNumbers = orderFlightDTO.getSeatNumbers();
        if (requestedSeatNumbers == null || requestedSeatNumbers.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (flight.getSeatAvailable() < requestedSeatNumbers.size()) {
            throw new AppException(ErrorCode.FLIGHT_OUT_OF_SEATS);
        }

        StringBuilder listSeatsStr = new StringBuilder();

        for (String seatNum : requestedSeatNumbers) {
            FlightSeat seat = flightSeatRepository.findByFlight_IdAndSeatNumber(flight.getId(), seatNum)
                    .orElseThrow(() -> new AppException(ErrorCode.SEAT_NOT_FOUND));

            if (Boolean.TRUE.equals(seat.isBooked()) || seat.getOrder() != null) {
                throw new AppException(ErrorCode.SEAT_ALREADY_BOOKED);
            }

            seat.setOrder(order);
            seat.setBooked(true);
            flightSeatRepository.save(seat);

            listSeatsStr.append(seatNum).append(" ");
        }

        flight.setSeatAvailable(flight.getSeatAvailable() - requestedSeatNumbers.size());
        flightRepository.save(flight);

        order.setFlight(flight);
        order.setListSeats(listSeatsStr.toString().trim());

        double realFlightPrice = calculateRealFlightPrice(flight);
        double totalFlightPrice = requestedSeatNumbers.size() * realFlightPrice;
        order.setTotalPrice(order.getTotalPrice() + totalFlightPrice);

        if (order.getPayment() == null) {
            order.setPayment(payRepository.findByStatus(PaymentStatus.UNPAID)
                    .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_UNPAID_NOT_EXISTS)));
        }

        return orderRepository.save(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));

        List<HotelBooking> bookings = hotelBookingRepository.findByOrderId(orderId);
        if (!bookings.isEmpty()) {
            hotelBookingRepository.deleteAll(bookings);
        }

        Flight flight = order.getFlight();
        if (flight != null) {
            List<FlightSeat> bookedSeats = flightSeatRepository.findByOrderId(orderId);
            flight.setSeatAvailable(flight.getSeatAvailable() + bookedSeats.size());
            flightRepository.save(flight);

            for (FlightSeat seat : bookedSeats) {
                seat.setBooked(false);
                seat.setOrder(null);
                flightSeatRepository.save(seat);
            }
        }
        orderRepository.delete(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Order cancelFlight(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));

        Flight flight = order.getFlight();
        if (flight == null) {
            return order;
        }

        List<FlightSeat> bookedSeats = flightSeatRepository.findByOrderId(orderId);
        flight.setSeatAvailable(flight.getSeatAvailable() + bookedSeats.size());
        flightRepository.save(flight);

        double realFlightPrice = calculateRealFlightPrice(flight);
        double flightPriceTotal = bookedSeats.size() * realFlightPrice;
        order.setTotalPrice(order.getTotalPrice() - flightPriceTotal);

        for (FlightSeat seat : bookedSeats) {
            seat.setBooked(false);
            seat.setOrder(null);
            flightSeatRepository.save(seat);
        }

        order.setFlight(null);
        return orderRepository.save(order);
    }

    // 👉 [ĐÃ SỬA]: Thêm (readOnly = true) và áp dụng giá cho cả list
    @Override
    @Transactional(readOnly = true)
    public PageResponse getOrdersByUserId(Long userId , int pageNo , int pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
        Page<Order> orders = orderRepository.findByUser(user,pageable) ;

        orders.forEach(this::applyDynamicPriceToOrder);

        return PageResponse.builder()
                .pageNo(pageNo)
                .pageSize(pageSize)
                .totalPages(orders.getTotalPages())
                .items(orders.getContent())
                .build();
    }

    // 👉 [ĐÃ SỬA]: Thêm (readOnly = true) và áp dụng giá cho cả list
    @Override
    @Transactional(readOnly = true)
    public PageResponse getAllOrders(int pageNo , int pageSize,String sortBy) {
        List<Sort.Order> sorts = new ArrayList<>();
        if(StringUtils.hasLength(sortBy)) {
            Pattern pattern = Pattern.compile("(\\w+?)(:)(.*)");
            Matcher matcher = pattern.matcher(sortBy);
            if(matcher.find()) {
                if(matcher.group(3).equalsIgnoreCase("asc")){
                    sorts.add(new Sort.Order(Sort.Direction.ASC,matcher.group(1)));
                }else {
                    sorts.add(new Sort.Order(Sort.Direction.DESC,matcher.group(1)));
                }
            }
        }
        Pageable pageable = PageRequest.of(pageNo, pageSize, Sort.by(sorts));
        Page<Order> orders = orderRepository.findAll(pageable);

        orders.forEach(this::applyDynamicPriceToOrder);

        return PageResponse.builder()
                .pageNo(pageNo)
                .pageSize(pageSize)
                .totalPages(orders.getTotalPages())
                .items(orders.getContent())
                .build();
    }

    // 👉 [ĐÃ SỬA]: Thêm (readOnly = true) và áp dụng giá cho cả list
    @Override
    @Transactional(readOnly = true)
    public PageResponse getAllOrdersByMultipleColumns(int pageNo, int pageSize, String... sorts) {
        List<Sort.Order> ordersSort = new ArrayList<>();
        for (String sortBy : sorts) {
            Pattern pattern = Pattern.compile("(\\w+?)(:)(.*)");
            Matcher matcher = pattern.matcher(sortBy);
            if(matcher.find()) {
                if(matcher.group(3).equalsIgnoreCase("asc")){
                    ordersSort.add(new Sort.Order(Sort.Direction.ASC,matcher.group(1)));
                }else {
                    ordersSort.add(new Sort.Order(Sort.Direction.DESC,matcher.group(1)));
                }
            }
        }
        Pageable pageable = PageRequest.of(pageNo, pageSize, Sort.by(ordersSort));
        Page<Order> orders = orderRepository.findAll(pageable);

        orders.forEach(this::applyDynamicPriceToOrder);

        return PageResponse.builder()
                .pageNo(pageNo)
                .pageSize(pageSize)
                .totalPages(orders.getTotalPages())
                .items(orders.getContent())
                .build();
    }

    @Override
    public PageResponse getAllOrderWithSortByMultipleColumsAndSearch(int pageNo, int pageSize, String search, String sortBy) {
        return searchRepository.getAllOrderWithSortByMultipleColumsAndSearch(pageNo,pageSize,search,sortBy);
    }

    @Override
    public PageResponse advanceSearchByCriteria(int pageNo, int pageSize, String sortBy, String... search) {
        return searchRepository.advanceSearchOrder(pageNo,pageSize,sortBy,search);
    }

    @Override
    public Order confirmPayment(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));
        Payment payment = payRepository.findByStatus(PaymentStatus.PAID).orElseThrow(()-> new AppException(ErrorCode.PAYMENT_PAID_NOT_EXISTS)) ;
        order.setPayment(payment);
        return orderRepository.save(order);
    }

    @Override
    public Order verifyPayment(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));
        order.setPayment(payRepository.findByStatus(PaymentStatus.VERIFYING).orElseThrow(()->new AppException(ErrorCode.PAYMENT_VERIFY_NOT_EXISTS)));
        return orderRepository.save(order);
    }

    @Override
    public Order payFalled(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));
        order.setPayment(payRepository.findByStatus(PaymentStatus.PAYMENT_FAILED).orElseThrow(()->new AppException(ErrorCode.PAYMENT_FALSE_NOT_EXISTS)));
        return orderRepository.save(order);
    }
}