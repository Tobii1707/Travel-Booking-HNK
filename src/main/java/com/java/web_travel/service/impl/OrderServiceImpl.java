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

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;
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

        // 1. Validate nội bộ ngày khách sạn (Check-in phải trước Check-out)
        if(orderHotelDTO.getStartHotel().after(orderHotelDTO.getEndHotel())){
            throw new AppException(ErrorCode.DATE_TIME_NOT_VALID);
        }

        // 2. Validate với chuyến bay
        Flight currentFlight = order.getFlight();
        if (currentFlight != null) {
            Date flightDeparture = getStartOfDay(currentFlight.getCheckInDate()); // Ngày bay đi
            Date hotelCheckIn = getStartOfDay(orderHotelDTO.getStartHotel());     // Ngày nhận phòng

            // Logic: Nếu ngày bay đi SAU ngày nhận phòng -> Lỗi
            if (flightDeparture.after(hotelCheckIn)) {
                throw new RuntimeException("Ngày bay đi (" + currentFlight.getCheckInDate() +
                        ") không được sau ngày nhận phòng (" + orderHotelDTO.getStartHotel() + ")");
            }
        }

        // 3. Validate số lượng phòng vs số người
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

        // 4. Tính toán giá tiền
        long diffInMillies = Math.abs(orderHotelDTO.getEndHotel().getTime() - orderHotelDTO.getStartHotel().getTime());
        long numberOfNights = TimeUnit.DAYS.convert(diffInMillies, TimeUnit.MILLISECONDS);

        if (numberOfNights < 1) {
            numberOfNights = 1;
        }

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
            totalPrice += (hotelBedroom.getPrice() * numberOfNights);
        }

        order.setListBedrooms(listBedrooms.toString());
        order.setTotalPrice(order.getTotalPrice() + totalPrice);
        return orderRepository.save(order);
    }

    // ... (Các method còn lại) ...

    @Override
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
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

        // --- SỬA LOGIC TẠI ĐÂY ---
        if (order.getStartHotel() != null && order.getEndHotel() != null) {
            Date flightDeparture = getStartOfDay(flight.getCheckInDate());
            // Date flightReturn = getStartOfDay(flight.getCheckOutDate()); // Không cần biến này nữa nếu không check
            Date hotelCheckIn = getStartOfDay(order.getStartHotel());
            Date hotelCheckOut = getStartOfDay(order.getEndHotel());

            // 1. Kiểm tra Ngày Bay Đi vs Ngày Nhận Phòng
            // Nếu Bay Đi (20) .after .Nhận Phòng (22) -> Sai (Vì 20 < 22 là False -> OK)
            // Nếu Bay Đi (25) .after .Nhận Phòng (22) -> Lỗi (True)
            if (flightDeparture.after(hotelCheckIn)) {
                throw new RuntimeException("Ngày bay đi (" + flight.getCheckInDate() +
                        ") không được sau ngày nhận phòng khách sạn (" + order.getStartHotel() + ")");
            }

            // 2. Kiểm tra Ngày Bay Về vs Ngày Trả Phòng
            // [CŨ - GÂY LỖI]: if (flightReturn.before(hotelCheckOut)) throw new AppException(ErrorCode.DATE_TIME_NOT_VALID);

            // Giải thích: Nếu bạn bay về ngày 20, nhưng trả phòng ngày 22.
            // 20 before 22 -> TRUE -> Ném lỗi DATE_TIME_NOT_VALID -> Đây là lỗi bạn gặp.
            // [MỚI]: Tôi đã comment dòng này lại để cho phép chuyến bay kết thúc trước khi trả phòng.
        }
        // -------------------------

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

        double totalFlightPrice = requestedSeatNumbers.size() * flight.getPrice();
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

        double flightPriceTotal = bookedSeats.size() * flight.getPrice();
        order.setTotalPrice(order.getTotalPrice() - flightPriceTotal);

        for (FlightSeat seat : bookedSeats) {
            seat.setBooked(false);
            seat.setOrder(null);
            flightSeatRepository.save(seat);
        }

        order.setFlight(null);
        return orderRepository.save(order);
    }

    @Override
    public PageResponse getOrdersByUserId(Long userId , int pageNo , int pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
        Page<Order> orders = orderRepository.findByUser(user,pageable) ;
        return PageResponse.builder()
                .pageNo(pageNo)
                .pageSize(pageSize)
                .totalPages(orders.getTotalPages())
                .items(orders)
                .build();
    }

    @Override
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

        return PageResponse.builder()
                .pageNo(pageNo)
                .pageSize(pageSize)
                .totalPages(orders.getTotalPages())
                .items(orders.getContent())
                .build();
    }

    @Override
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
}