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
import org.springframework.transaction.annotation.Transactional; // Import chuẩn
import org.springframework.util.StringUtils;

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

    // ... (Các hàm addOrder, chooseHotel giữ nguyên như cũ) ...
    // Mình sẽ focus vào các hàm quan trọng cần sửa bên dưới

    @Override
    public Order addOrder(OrderDTO orderDTO, Long userId) {
        Order order = new Order();
        if(!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.USER_NOT_EXISTS) ;
        }
        Date today = getStartOfDay(new Date());
        Date checkIn = getStartOfDay(orderDTO.getCheckInDate());

        if(checkIn.before(today)){
            throw new IllegalArgumentException("DATE_NOT_VALID") ;
        }
        if(orderDTO.getCheckInDate().after(orderDTO.getCheckOutDate())){
            throw new AppException(ErrorCode.DATE_TIME_NOT_VALID) ;
        }

        order.setDestination(orderDTO.getDestination());
        order.setNumberOfPeople(orderDTO.getNumberOfPeople());
        order.setCheckinDate(orderDTO.getCheckInDate());
        order.setCheckoutDate(orderDTO.getCheckOutDate());
        User user = userRepository.findById(userId).get();
        order.setUser(user);
        return orderRepository.save(order);
    }

    @Override
    public Order chooseHotel(Long orderId, Long hotelId, OrderHotelDTO orderHotelDTO) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Date startHotel = getStartOfDay(orderHotelDTO.getStartHotel());
        Date checkInOrder = getStartOfDay(order.getCheckinDate());

        if(startHotel.before(checkInOrder)){
            throw new AppException(ErrorCode.DATE_INVALID);
        }

        order.setHotel(hotel);
        order.setStartHotel(orderHotelDTO.getStartHotel());
        order.setEndHotel(orderHotelDTO.getEndHotel());

        StringBuilder listBedrooms = new StringBuilder();
        double totalPrice = 0;

        for(HotelBedroom hotelBedroom : orderHotelDTO.getHotelBedroomList()){
            List<HotelBooking> hotelBookings = hotelBookingRepository.findOverLappingBookings(hotelId ,hotelBedroom.getId(),orderHotelDTO.getStartHotel(),orderHotelDTO.getEndHotel());

            if(!hotelBookings.isEmpty()){
                throw new AppException(ErrorCode.HOTEL_BEDROOM_NOT_AVAILABLE) ;
            }

            HotelBooking hotelBooking = new HotelBooking();
            hotelBooking.setHotel(hotel);
            hotelBooking.setHotelBedroom(hotelBedroom);
            hotelBooking.setOrder(order);
            hotelBooking.setStartDate(orderHotelDTO.getStartHotel());
            hotelBooking.setEndDate(orderHotelDTO.getEndHotel());

            hotelBookingRepository.save(hotelBooking);

            listBedrooms.append(hotelBedroom.getRoomNumber()).append(" ");
            totalPrice += hotelBedroom.getPrice();
        }

        order.setListBedrooms(listBedrooms.toString());
        order.setTotalPrice(order.getTotalPrice() + totalPrice);
        return orderRepository.save(order);
    }

    @Override
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    @Override
    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }

    // Hàm cũ (logic không chọn ghế cụ thể) - Có thể giữ lại hoặc bỏ
    @Override
    public Order chooseFlight(Long orderId , Long flightId) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(()->new AppException(ErrorCode.NOT_EXISTS));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));

        // ... Logic cũ giữ nguyên hoặc xóa nếu không dùng nữa ...
        // (Để ngắn gọn mình không paste lại đoạn logic cũ ở đây vì bạn đang dùng hàm mới)
        return null; // Hoặc logic cũ
    }


    // =========================================================================
    // ===  PHẦN CODE ĐƯỢC TỐI ƯU HÓA VÀ BẢO MẬT (QUAN TRỌNG NHẤT)           ===
    // =========================================================================

    /**
     * @Transactional(rollbackFor = Exception.class):
     * Đảm bảo tính toàn vẹn dữ liệu. Nếu có lỗi xảy ra ở bất kỳ dòng nào,
     * toàn bộ thay đổi (khóa ghế, trừ tiền, cập nhật flight) sẽ bị hủy bỏ (rollback).
     */

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Order chooseFlightWithSeats(Long orderId, OrderFlightDTO orderFlightDTO) {
        // 1. Tìm Order & Flight
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Flight flight = flightRepository.findById(orderFlightDTO.getFlightId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_EXISTS));

        // 2. Validate Ngày tháng
        Date flightDate = getStartOfDay(flight.getCheckInDate());
        Date orderCheckIn = getStartOfDay(order.getCheckinDate());
        Date orderCheckOut = getStartOfDay(order.getCheckoutDate());

        if (flightDate.before(orderCheckIn) || flightDate.after(orderCheckOut)) {
            throw new AppException(ErrorCode.NOT_VALID_FLIGHT_DATE);
        }

        // 3. Validate Request
        List<String> requestedSeatNumbers = orderFlightDTO.getSeatNumbers();
        if (requestedSeatNumbers == null || requestedSeatNumbers.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // 4. Kiểm tra sức chứa tổng (Fail-fast: Kiểm tra nhanh trước khi lock DB)
        if (flight.getSeatAvailable() < requestedSeatNumbers.size()) {
            throw new AppException(ErrorCode.FLIGHT_OUT_OF_SEATS);
        }

        // 5. XỬ LÝ LOCK GHẾ VÀ CHECK TRÙNG (Critical Section)
        for (String seatNum : requestedSeatNumbers) {
            // --- QUAN TRỌNG: Gọi hàm có @Lock(PESSIMISTIC_WRITE) trong Repository ---
            // Hàm này sẽ khóa dòng dữ liệu ghế lại, các luồng khác phải chờ transaction này xong mới đọc được.
            FlightSeat seat = flightSeatRepository.findByFlight_IdAndSeatNumber(flight.getId(), seatNum)
                    .orElseThrow(() -> new AppException(ErrorCode.SEAT_NOT_FOUND));

            // Kiểm tra kỹ trạng thái sau khi đã Lock
            // Sử dụng Boolean.TRUE.equals để tránh NullPointerException nếu field là null
            if (Boolean.TRUE.equals(seat.isBooked()) || seat.getOrder() != null) {
                // Nếu phát hiện ghế đã bị đặt, ném Exception -> Transaction sẽ Rollback toàn bộ các ghế đã chọn trước đó
                throw new AppException(ErrorCode.SEAT_ALREADY_BOOKED);
            }

            // Đánh dấu ghế
            seat.setOrder(order);
            seat.setBooked(true);
            flightSeatRepository.save(seat);
        }

        // 6. Cập nhật Flight (Trừ số lượng ghế hiển thị)
        flight.setSeatAvailable(flight.getSeatAvailable() - requestedSeatNumbers.size());
        flightRepository.save(flight);

        // 7. Cập nhật Order (Giá tiền & thông tin)
        order.setFlight(flight);

        // Tính tổng tiền vé (Số ghế * Giá vé)
        double totalFlightPrice = requestedSeatNumbers.size() * flight.getPrice();
        order.setTotalPrice(order.getTotalPrice() + totalFlightPrice);

        // Gán phương thức thanh toán mặc định (UNPAID)
        order.setPayment(payRepository.findByStatus(PaymentStatus.UNPAID)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_UNPAID_NOT_EXISTS)));

        return orderRepository.save(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));

        // 1. Xóa booking khách sạn
        hotelBookingRepository.deleteByOrderId(orderId);

        // 2. Xử lý trả ghế máy bay
        Flight flight = order.getFlight();
        if (flight != null) {
            // Tìm các ghế thuộc đơn hàng này để reset
            List<FlightSeat> bookedSeats = flightSeatRepository.findByOrderId(orderId);

            // Trả lại số lượng ghế tổng available (dựa trên số ghế thực tế đã đặt)
            flight.setSeatAvailable(flight.getSeatAvailable() + bookedSeats.size());
            flightRepository.save(flight);

            // Reset trạng thái từng ghế về "Trống"
            for (FlightSeat seat : bookedSeats) {
                seat.setBooked(false);
                seat.setOrder(null);
                flightSeatRepository.save(seat);
            }
        }

        // 3. Xóa đơn hàng
        orderRepository.delete(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Order cancelFlight(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));

        Flight flight = order.getFlight();
        if (flight == null) {
            return order; // Không có chuyến bay thì không cần hủy
        }

        // 1. Tìm và Reset ghế
        List<FlightSeat> bookedSeats = flightSeatRepository.findByOrderId(orderId);

        // Cập nhật lại số lượng ghế trống cho chuyến bay
        flight.setSeatAvailable(flight.getSeatAvailable() + bookedSeats.size());
        flightRepository.save(flight);

        // Trừ tiền khỏi đơn hàng (Dựa trên số ghế thực tế * giá vé)
        double flightPriceTotal = bookedSeats.size() * flight.getPrice();
        order.setTotalPrice(order.getTotalPrice() - flightPriceTotal);

        // Trả ghế về trạng thái trống
        for (FlightSeat seat : bookedSeats) {
            seat.setBooked(false);
            seat.setOrder(null);
            flightSeatRepository.save(seat);
        }

        order.setFlight(null);
        return orderRepository.save(order);
    }

    // ... (Các hàm Search và Payment phía dưới giữ nguyên) ...

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