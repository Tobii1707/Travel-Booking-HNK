package com.java.web_travel.service.impl;

import com.java.web_travel.convert.HotelConverter;
import com.java.web_travel.entity.HolidayPolicy;
import com.java.web_travel.entity.Hotel;
import com.java.web_travel.entity.HotelBedroom;
import com.java.web_travel.entity.HotelGroup;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.enums.OrderStatus;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.AssignGroupRequest;
import com.java.web_travel.model.request.BulkUpdatePriceRequest;
import com.java.web_travel.model.request.HotelDTO;
import com.java.web_travel.model.response.HotelResponse;
import com.java.web_travel.repository.HolidayPolicyRepository;
import com.java.web_travel.repository.HotelBedroomRepository;
import com.java.web_travel.repository.HotelGroupRepository;
import com.java.web_travel.repository.HotelRepository;
import com.java.web_travel.repository.OrderRepository;
import com.java.web_travel.service.HotelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HotelServiceImpl implements HotelService {

    @Autowired private HotelRepository hotelRepository;
    @Autowired private HotelConverter hotelConverter;
    @Autowired private OrderRepository orderRepository;

    @Autowired private HotelGroupRepository hotelGroupRepository;
    @Autowired private HolidayPolicyRepository holidayPolicyRepository;
    @Autowired private HotelBedroomRepository hotelBedroomRepository;

    // =========================================================================
    //  UTILITIES (ĐÃ NÂNG CẤP MẠNH HƠN)
    // =========================================================================

    /**
     * [FIXED v2] Xử lý tên "Siêu mạnh":
     * 1. Xóa ký tự trắng đặc biệt (Non-breaking space \u00A0).
     * 2. Xóa bất kỳ cụm (...) nào ở cuối, bất chấp dấu cách thừa.
     */
    private String appendGroupName(String currentName, String newGroupName) {
        if (currentName == null) return "";

        // Bước 1: Chuẩn hóa chuỗi (Quan trọng: Xử lý Non-breaking space)
        String cleanName = currentName.replace('\u00A0', ' ').trim();

        // Bước 2: REGEX NÂNG CAO
        cleanName = cleanName.replaceAll("\\s*\\([^)]*\\)\\s*$", "");

        // Bước 3: Trả về tên sạch + Group mới
        return cleanName + " (" + newGroupName + ")";
    }

    // [CẬP NHẬT] Thêm chốt chặn để giá không bao giờ bị ÂM
    private Double smartRoundPrice(Double rawPrice) {
        if (rawPrice == null) return 0.0;
        double rounded = Math.round(rawPrice / 10000.0) * 10000.0;
        return rounded < 0 ? 0.0 : rounded;
    }

    // =========================================================================
    //  CHỨC NĂNG CỐT LÕI
    // =========================================================================

    // --- 1. TẠO MỚI ---
    @Override
    @Transactional
    public HotelResponse createHotel(HotelDTO hotelDTO) {
        // Giá gốc khi tạo mới không được âm
        if(hotelDTO.getPriceFrom() < 0){
            throw new AppException(ErrorCode.PRICE_NOT_VALID);
        }

        Hotel hotel = hotelConverter.convertHotel(hotelDTO);

        if (hotelDTO.getHotelGroupId() != null) {
            HotelGroup group = hotelGroupRepository.findById(hotelDTO.getHotelGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            hotel.setHotelGroup(group);
            // Logic mới sẽ tự động xử lý tên chuẩn
            hotel.setHotelName(appendGroupName(hotel.getHotelName(), group.getGroupName()));
        }

        Hotel savedHotel = hotelRepository.save(hotel);
        return hotelConverter.toHotelResponse(savedHotel);
    }

    // --- 2. CHI TIẾT (ĐÃ FIX: NẠP PHÒNG THỦ CÔNG & ĐỒNG BỘ GIÁ) ---
    @Override
    public HotelResponse getHotel(Long hotelId) {
        // 1. Lấy thông tin từ DB (Giá gốc)
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        // 2. Convert sang Response
        HotelResponse response = hotelConverter.toHotelResponse(hotel);

        // --- NẠP DANH SÁCH PHÒNG ---
        response.setHotelBedrooms(hotel.getHotelBedrooms());

        // 3. Logic tính giá động (Holiday Policy)
        if (hotel.getHotelGroup() != null) {
            LocalDate today = LocalDate.now();

            // Tìm policy active
            List<HolidayPolicy> policies = holidayPolicyRepository
                    .findActivePolicies(hotel.getHotelGroup().getId(), today);

            // Nếu hôm nay có Policy (Ngày lễ hoặc Khuyến mãi) -> Tính lại giá hiển thị
            if (!policies.isEmpty()) {
                HolidayPolicy policy = policies.get(0);

                // Tính tỷ lệ (Ví dụ: +20% -> 1.2 || -20% -> 0.8)
                double rate = 1.0 + (policy.getIncreasePercentage() / 100.0);

                // A. Cập nhật giá KHÁCH SẠN (Header)
                Double oldHotelPrice = response.getHotelPriceFrom();
                response.setHotelPriceFrom(smartRoundPrice(oldHotelPrice * rate));

                // B. Cập nhật giá TỪNG PHÒNG
                if (response.getHotelBedrooms() != null) {
                    for (var room : response.getHotelBedrooms()) {
                        Double oldRoomPrice = room.getPrice();
                        room.setPrice(smartRoundPrice(oldRoomPrice * rate));
                    }
                }
            }
        }

        return response;
    }

    // --- 3. LẤY TẤT CẢ ---
    @Override
    public List<HotelResponse> getAllHotels() {
        List<Hotel> hotels = hotelRepository.findAllByDeletedFalse();
        LocalDate today = LocalDate.now();

        return hotels.stream()
                .map(hotel -> {
                    HotelResponse response = hotelConverter.toHotelResponse(hotel);
                    Double dynamicPrice = calculateDynamicPrice(hotel.getId(), today);
                    response.setHotelPriceFrom(dynamicPrice);
                    return response;
                })
                .collect(Collectors.toList());
    }

    // --- 4. CẬP NHẬT ---
    @Override
    @Transactional
    public HotelResponse updateHotel(HotelDTO hotelDTO , Long hotelId){
        if(hotelDTO.getPriceFrom() < 0){
            throw new AppException(ErrorCode.PRICE_NOT_VALID);
        }

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        // Lưu lại giá cũ và giá mới
        Double oldPrice = hotel.getHotelPriceFrom();
        Double newPrice = hotelDTO.getPriceFrom();
        boolean isPriceChanged = newPrice != null && !newPrice.equals(oldPrice);

        // Update thông tin cơ bản
        hotel.setHotelName(hotelDTO.getHotelName());
        hotel.setHotelPriceFrom(newPrice);
        hotel.setAddress(hotelDTO.getAddress());
        hotel.setNumberFloor(hotelDTO.getNumberFloor());
        hotel.setNumberRoomPerFloor(hotelDTO.getNumberRoomPerFloor());

        // Xử lý Group
        if (hotelDTO.getHotelGroupId() != null) {
            HotelGroup group = hotelGroupRepository.findById(hotelDTO.getHotelGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found"));
            hotel.setHotelGroup(group);

            // Logic Regex sẽ xóa group cũ đi trước khi thêm group mới
            hotel.setHotelName(appendGroupName(hotel.getHotelName(), group.getGroupName()));
        }

        Hotel updatedHotel = hotelRepository.save(hotel);

        // --- CẬP NHẬT GIÁ PHÒNG ---
        if (isPriceChanged) {
            List<HotelBedroom> rooms = hotelBedroomRepository.findByHotelId(hotelId);

            for (HotelBedroom room : rooms) {
                double calculatedPrice;
                if ("Vip Room".equalsIgnoreCase(room.getRoomType())) {
                    calculatedPrice = newPrice * 1.5;
                } else {
                    calculatedPrice = newPrice;
                }
                room.setPrice(smartRoundPrice(calculatedPrice));
            }

            hotelBedroomRepository.saveAll(rooms);
        }

        return hotelConverter.toHotelResponse(updatedHotel);
    }

    // --- 5. XÓA KHÁCH SẠN ---
    @Override
    @Transactional
    public void deleteHotel(Long hotelId, boolean force) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        List<OrderStatus> activeStatuses = List.of(OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.CONFIRMED);
        long activeOrdersCount = orderRepository.countActiveOrdersByHotel(hotelId, activeStatuses);

        if (activeOrdersCount > 0) {
            if (!force) {
                throw new RuntimeException("CẢNH BÁO: Đang có " + activeOrdersCount + " đơn chưa hoàn thành. Cần force=true để tiếp tục.");
            }
            orderRepository.cancelAllActiveOrdersByHotel(hotelId, activeStatuses, OrderStatus.CANCELLED);
        }

        hotel.setDeleted(true);
        hotelRepository.save(hotel);
    }

    // --- 6. TÌM KIẾM THEO ĐỊA ĐIỂM (ĐÃ FIX: CẬP NHẬT GIÁ ĐỘNG) ---
    @Override
    public List<HotelResponse> getHotelsByDestination(String destination) {
        List<Hotel> hotels = hotelRepository.findByDestination(destination);
        LocalDate today = LocalDate.now(); // 1. Lấy ngày hiện tại

        return hotels.stream()
                .filter(h -> !h.isDeleted())
                .map(hotel -> {
                    // 2. Convert sang Response
                    HotelResponse response = hotelConverter.toHotelResponse(hotel);

                    // 3. [FIX] Tính lại giá động (Dynamic Price) - QUAN TRỌNG
                    Double dynamicPrice = calculateDynamicPrice(hotel.getId(), today);
                    response.setHotelPriceFrom(dynamicPrice);

                    return response;
                })
                .collect(Collectors.toList());
    }

    // --- 7. THÙNG RÁC ---
    @Override
    public List<HotelResponse> getDeletedHotels() {
        List<Hotel> deletedHotels = hotelRepository.findAllByDeletedTrue();
        return deletedHotels.stream()
                .map(hotel -> hotelConverter.toHotelResponse(hotel))
                .collect(Collectors.toList());
    }

    // --- 8. KHÔI PHỤC ---
    @Override
    @Transactional
    public void restoreHotel(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));
        hotel.setDeleted(false);
        hotelRepository.save(hotel);
    }

    // =========================================================================
    //  CÁC CHỨC NĂNG MỚI (GROUP & GIÁ)
    // =========================================================================

    // --- 9. TÍNH GIÁ ĐỘNG (Helper function) ---
    @Override
    public Double calculateDynamicPrice(Long hotelId, LocalDate dateToCheck) {
        Hotel hotel = hotelRepository.findById(hotelId).orElse(null);
        if (hotel == null) return 0.0;

        Double basePrice = hotel.getHotelPriceFrom();
        if (hotel.getHotelGroup() == null) return basePrice;

        List<HolidayPolicy> policies = holidayPolicyRepository
                .findActivePolicies(hotel.getHotelGroup().getId(), dateToCheck);

        if (!policies.isEmpty()) {
            HolidayPolicy policy = policies.get(0);
            double surcharge = basePrice * (policy.getIncreasePercentage() / 100.0);
            return smartRoundPrice(basePrice + surcharge);
        }
        return basePrice;
    }

    // --- 10. THÊM NHIỀU KS VÀO GROUP ---
    @Override
    @Transactional
    public void addHotelsToGroup(AssignGroupRequest request) {
        HotelGroup group = hotelGroupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));

        List<Hotel> hotels = hotelRepository.findAllById(request.getHotelIds());

        for (Hotel hotel : hotels) {
            hotel.setHotelGroup(group);
            // Logic Regex sẽ xóa group cũ đi trước khi thêm group mới
            hotel.setHotelName(appendGroupName(hotel.getHotelName(), group.getGroupName()));
        }
        hotelRepository.saveAll(hotels);
    }

    // --- 11. TĂNG/GIẢM GIÁ VĨNH VIỄN ---
    @Override
    @Transactional
    public void bulkUpdatePricePermanent(BulkUpdatePriceRequest request) {
        if (request.getPercentage() <= -100) {
            throw new RuntimeException("Lỗi: Không thể giảm giá quá 100%!");
        }

        // 1. Lấy danh sách khách sạn
        List<Hotel> hotels = hotelRepository.findAllByHotelGroupIdAndDeletedFalse(request.getGroupId());
        if (hotels.isEmpty()) {
            throw new AppException(ErrorCode.HOTEL_NOT_FOUND);
        }

        double rate = 1.0 + (request.getPercentage() / 100.0);

        // 2. Cập nhật giá KHÁCH SẠN
        for (Hotel hotel : hotels) {
            Double oldPrice = hotel.getHotelPriceFrom();
            hotel.setHotelPriceFrom(smartRoundPrice(oldPrice * rate));
        }
        hotelRepository.saveAll(hotels);

        // 3. Cập nhật giá PHÒNG NGỦ
        List<Long> hotelIds = hotels.stream()
                .map(Hotel::getId)
                .collect(Collectors.toList());

        List<HotelBedroom> rooms = hotelBedroomRepository.findByHotelIdIn(hotelIds);

        for (HotelBedroom room : rooms) {
            Double oldRoomPrice = room.getPrice();
            room.setPrice(smartRoundPrice(oldRoomPrice * rate));
        }

        hotelBedroomRepository.saveAll(rooms);
    }
}