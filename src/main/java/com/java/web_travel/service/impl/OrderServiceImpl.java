package com.java.web_travel.service.impl;

import com.java.web_travel.entity.*;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.enums.PaymentStatus;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.OrderDTO;
import com.java.web_travel.model.request.OrderHotelDTO;
import com.java.web_travel.model.response.PageResponse;
import com.java.web_travel.repository.*;
import com.java.web_travel.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service // Đánh dấu class này là một Service (Business Logic Layer) để Spring quản lý
public class OrderServiceImpl implements OrderService {

    // Tiêm (Inject) các Repository để tương tác với Database
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private HotelRepository hotelRepository;
    @Autowired
    private FlightRepository flightRepository;
    @Autowired
    private SearchRepository searchRepository; // Repository tùy biến cho chức năng tìm kiếm nâng cao
    @Autowired
    private HotelBedroomRepository hotelBedroomRepository;
    @Autowired
    private HotelBookingRepository hotelBookingRepository;
    @Autowired
    private PayRepository payRepository;

    // --- CHỨC NĂNG 1: TẠO ĐƠN HÀNG MỚI ---
    @Override
    public Order addOrder(OrderDTO orderDTO, Long userId) {
        Order order = new Order(); // Khởi tạo entity Order

        // Kiểm tra xem User có tồn tại trong DB không
        if(!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.USER_NOT_EXISTS) ;
        }

        // --- XỬ LÝ NGÀY THÁNG ---
        // Lấy ngày hiện tại và đưa về 00:00:00 để so sánh chuẩn xác
        Date today = getStartOfDay(new Date());
        // Lấy ngày check-in từ request và đưa về 00:00:00
        Date checkIn = getStartOfDay(orderDTO.getCheckInDate());

        // Logic: Không được đặt ngày Check-in trong quá khứ (trước hôm nay)
        if(checkIn.before(today)){
            throw new IllegalArgumentException("DATE_NOT_VALID") ;
        }
        // Logic: Ngày check-in phải đứng trước ngày check-out
        if(orderDTO.getCheckInDate().after(orderDTO.getCheckOutDate())){
            throw new AppException(ErrorCode.DATE_TIME_NOT_VALID) ;
        }

        // Map dữ liệu từ DTO (Request) sang Entity (Database)
        order.setDestination(orderDTO.getDestination());
        order.setNumberOfPeople(orderDTO.getNumberOfPeople());
        order.setCheckinDate(orderDTO.getCheckInDate());
        order.setCheckoutDate(orderDTO.getCheckOutDate());

        // Lấy thông tin User đầy đủ và gán vào đơn hàng
        User user = userRepository.findById(userId).get();
        order.setUser(user);

        // Lưu đơn hàng xuống Database
        return orderRepository.save(order);
    }

    // --- CHỨC NĂNG 2: CHỌN KHÁCH SẠN CHO ĐƠN HÀNG ---
    @Override
    public Order chooseHotel(Long orderId, Long hotelId, OrderHotelDTO orderHotelDTO) {
        // Tìm thông tin khách sạn
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        // Tìm thông tin đơn hàng
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Chuẩn hóa ngày về 00:00:00
        Date startHotel = getStartOfDay(orderHotelDTO.getStartHotel());
        Date checkInOrder = getStartOfDay(order.getCheckinDate());

        // Logic: Ngày bắt đầu ở khách sạn không được trước ngày bắt đầu Tour
        if(startHotel.before(checkInOrder)){
            throw new AppException(ErrorCode.DATE_INVALID);
        }

        // Cập nhật thông tin khách sạn vào Order
        order.setHotel(hotel);
        order.setStartHotel(orderHotelDTO.getStartHotel());
        order.setEndHotel(orderHotelDTO.getEndHotel());

        StringBuilder listBedrooms = new StringBuilder(); // Dùng StringBuilder để nối chuỗi tên phòng tối ưu hơn
        double totalPrice = 0; // Biến tạm tính tổng tiền phòng

        // Duyệt qua danh sách các phòng khách muốn đặt
        for(HotelBedroom hotelBedroom : orderHotelDTO.getHotelBedroomList()){
            // Logic quan trọng: Kiểm tra xem phòng này đã có ai đặt trong khoảng thời gian đó chưa
            List<HotelBooking> hotelBookings = hotelBookingRepository.findOverLappingBookings(hotelId ,hotelBedroom.getId(),orderHotelDTO.getStartHotel(),orderHotelDTO.getEndHotel());

            // Nếu list không rỗng tức là bị trùng lịch -> Báo lỗi
            if(!hotelBookings.isEmpty()){
                throw new AppException(ErrorCode.HOTEL_BEDROOM_NOT_AVAILABLE) ;
            }

            // Tạo booking chi tiết cho từng phòng
            HotelBooking hotelBooking = new HotelBooking();
            hotelBooking.setHotel(hotel);
            hotelBooking.setHotelBedroom(hotelBedroom);
            hotelBooking.setOrder(order);
            hotelBooking.setStartDate(orderHotelDTO.getStartHotel());
            hotelBooking.setEndDate(orderHotelDTO.getEndHotel());

            // Lưu booking phòng xuống DB
            hotelBookingRepository.save(hotelBooking);

            // Ghi nhận số phòng và cộng dồn giá tiền
            listBedrooms.append(hotelBedroom.getRoomNumber()).append(" ");
            totalPrice += hotelBedroom.getPrice();
        }

        // Cập nhật lại danh sách phòng và tổng tiền cho đơn hàng
        order.setListBedrooms(listBedrooms.toString());
        order.setTotalPrice(order.getTotalPrice() + totalPrice);
        return orderRepository.save(order);
    }

    @Override
    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }

    // --- CHỨC NĂNG 3: CHỌN CHUYẾN BAY ---
    @Override
    public Order chooseFlight(Long orderId , Long flightId) {
        // 1. Tìm dữ liệu chuyến bay và đơn hàng
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(()->new AppException(ErrorCode.NOT_EXISTS));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));

        // 2. Xử lý logic thời gian (Chuẩn hóa về 00:00:00 để so sánh logic chính xác)
        Date flightDate = getStartOfDay(flight.getCheckInDate());
        Date orderCheckIn = getStartOfDay(order.getCheckinDate());
        Date orderCheckOut = getStartOfDay(order.getCheckoutDate());

        // Logic: Ngày bay KHÔNG ĐƯỢC phép trước ngày bắt đầu tour
        if (flightDate.before(orderCheckIn)) {
            throw new AppException(ErrorCode.NOT_VALID_FLIGHT_DATE);
        }
        // Logic: Ngày bay KHÔNG ĐƯỢC phép sau ngày kết thúc tour
        if (flightDate.after(orderCheckOut)) {
            throw new AppException(ErrorCode.NOT_VALID_FLIGHT_DATE);
        }

        // 3. Kiểm tra số lượng ghế trống có đủ cho số người trong đơn hàng không
        if (flight.getSeatAvailable() < order.getNumberOfPeople()) {
            throw new AppException(ErrorCode.FLIGHT_OUT_OF_SEATS);
        }

        // 4. Cập nhật dữ liệu
        // Trừ số ghế trong kho của chuyến bay
        flight.setSeatAvailable(flight.getSeatAvailable() - order.getNumberOfPeople());
        flightRepository.save(flight);

        // Gán chuyến bay vào đơn hàng
        order.setFlight(flight);

        // Cộng tiền vé máy bay vào tổng đơn hàng (Giá vé * Số người)
        order.setTotalPrice(order.getTotalPrice() + (order.getNumberOfPeople() * flight.getPrice()));

        // Set trạng thái thanh toán là "Chưa thanh toán" (UNPAID)
        order.setPayment(payRepository.findByStatus(PaymentStatus.UNPAID)
                .orElseThrow(()->new AppException(ErrorCode.PAYMENT_UNPAID_NOT_EXISTS)));

        return orderRepository.save(order);
    }

    // --- CHỨC NĂNG 4: HỦY ĐƠN HÀNG ---
    @Override
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Bước 1: Xóa các booking phòng khách sạn liên quan đến đơn hàng này
        hotelBookingRepository.deleteByOrderId(orderId);

        // Bước 2: Hoàn trả lại ghế máy bay (nếu đơn hàng đã đặt vé)
        Flight flight = order.getFlight();
        if (flight != null) {
            flight.setSeatAvailable(flight.getSeatAvailable() + order.getNumberOfPeople());
            flightRepository.save(flight);
        }

        // Bước 3: Xóa đơn hàng khỏi DB
        orderRepository.delete(order);
    }

    // --- CHỨC NĂNG 5: HỦY VÉ MÁY BAY (GIỮ ĐƠN HÀNG) ---
    @Override
    public Order cancelFlight(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));

        Flight flight = order.getFlight();
        // Kiểm tra nếu đơn hàng có vé máy bay thì mới xử lý
        if (flight != null) {
            // 1. Trả lại ghế (cộng thêm vào kho) cho chuyến bay
            flight.setSeatAvailable(flight.getSeatAvailable() + order.getNumberOfPeople());
            flightRepository.save(flight);

            // 2. Trừ tiền vé máy bay khỏi tổng tiền đơn hàng
            double flightPriceTotal = order.getNumberOfPeople() * flight.getPrice();
            order.setTotalPrice(order.getTotalPrice() - flightPriceTotal);
        }

        // Xóa liên kết chuyến bay khỏi đơn hàng
        order.setFlight(null);
        return orderRepository.save(order);
    }

    // --- CHỨC NĂNG 6: LẤY DANH SÁCH ĐƠN HÀNG CỦA USER (CÓ PHÂN TRANG) ---
    @Override
    public PageResponse getOrdersByUserId(Long userId , int pageNo , int pageSize) {
        // Tạo đối tượng Pageable để phân trang
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

        // Tìm đơn hàng theo User
        Page<Order> orders = orderRepository.findByUser(user,pageable) ;

        // Trả về response chuẩn định dạng phân trang
        return PageResponse.builder()
                .pageNo(pageNo)
                .pageSize(pageSize)
                .totalPages(orders.getTotalPages())
                .items(orders)
                .build();
    }

    // --- CHỨC NĂNG 7: LẤY TẤT CẢ ĐƠN HÀNG (CÓ SẮP XẾP & PHÂN TRANG) ---
    @Override
    public PageResponse getAllOrders(int pageNo , int pageSize,String sortBy) {
        List<Sort.Order> sorts = new ArrayList<>();
        // Xử lý chuỗi sortBy (ví dụ: "price:asc")
        if(StringUtils.hasLength(sortBy)) {
            // Regex để tách tên trường và chiều sắp xếp
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

    // --- CHỨC NĂNG 8: SẮP XẾP NHIỀU CỘT ---
    @Override
    public PageResponse getAllOrdersByMultipleColumns(int pageNo, int pageSize, String... sorts) {
        List<Sort.Order> ordersSort = new ArrayList<>();
        // Duyệt qua mảng các chuỗi sắp xếp
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

    // --- CÁC CHỨC NĂNG TÌM KIẾM & THANH TOÁN KHÁC ---

    @Override
    public PageResponse getAllOrderWithSortByMultipleColumsAndSearch(int pageNo, int pageSize, String search, String sortBy) {
        // Gọi xuống SearchRepository để xử lý query phức tạp
        return searchRepository.getAllOrderWithSortByMultipleColumsAndSearch(pageNo,pageSize,search,sortBy);
    }

    @Override
    public PageResponse advanceSearchByCriteria(int pageNo, int pageSize, String sortBy, String... search) {
        // Tìm kiếm nâng cao
        return searchRepository.advanceSearchOrder(pageNo,pageSize,sortBy,search);
    }

    @Override
    public Order confirmPayment(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));
        // Xác nhận trạng thái ĐÃ THANH TOÁN (PAID)
        Payment payment = payRepository.findByStatus(PaymentStatus.PAID).orElseThrow(()-> new AppException(ErrorCode.PAYMENT_PAID_NOT_EXISTS)) ;
        order.setPayment(payment);
        return orderRepository.save(order);
    }

    @Override
    public Order verifyPayment(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));
        // Chuyển trạng thái sang ĐANG XÁC MINH (VERIFYING)
        order.setPayment(payRepository.findByStatus(PaymentStatus.VERIFYING).orElseThrow(()->new AppException(ErrorCode.PAYMENT_VERIFY_NOT_EXISTS)));
        return orderRepository.save(order);
    }

    @Override
    public Order payFalled(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));
        // Chuyển trạng thái sang THANH TOÁN THẤT BẠI
        order.setPayment(payRepository.findByStatus(PaymentStatus.PAYMENT_FAILED).orElseThrow(()->new AppException(ErrorCode.PAYMENT_FALSE_NOT_EXISTS)));
        return orderRepository.save(order);
    }

    // --- HÀM PHỤ TRỢ (HELPER METHOD) ---

    /**
     * Đưa thời gian về đầu ngày (00:00:00.000)
     * Giúp so sánh ngày tháng logic (ví dụ: ngày check-in, ngày bay) mà không bị lệch do giờ phút
     */
    private Date getStartOfDay(Date date) {
        if (date == null) return null;
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        // Reset giờ, phút, giây, mili-giây về 0
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTime();
    }
}