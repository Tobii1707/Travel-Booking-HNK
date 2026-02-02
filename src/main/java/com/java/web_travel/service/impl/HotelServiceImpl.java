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
import com.java.web_travel.model.request.BulkUpdatePriceByListRequest;
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
    //  UTILITIES
    // =========================================================================

    private String appendGroupName(String currentName, String newGroupName) {
        if (currentName == null) return "";
        String cleanName = currentName.replace('\u00A0', ' ').trim();
        cleanName = cleanName.replaceAll("\\s*\\([^)]*\\)\\s*$", "");
        return cleanName + " (" + newGroupName + ")";
    }

    private Double smartRoundPrice(Double rawPrice) {
        if (rawPrice == null) return 0.0;
        double rounded = Math.round(rawPrice / 10000.0) * 10000.0;
        return rounded < 0 ? 0.0 : rounded;
    }

    // =========================================================================
    //  CHỨC NĂNG CỐT LÕI (CRUD)
    // =========================================================================

    // --- 1. TẠO MỚI ---
    @Override
    @Transactional
    public HotelResponse createHotel(HotelDTO hotelDTO) {
        if(hotelDTO.getPriceFrom() < 0){
            throw new AppException(ErrorCode.PRICE_NOT_VALID);
        }

        Hotel hotel = hotelConverter.convertHotel(hotelDTO);

        if (hotelDTO.getHotelGroupId() != null) {
            HotelGroup group = hotelGroupRepository.findById(hotelDTO.getHotelGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            hotel.setHotelGroup(group);
            hotel.setHotelName(appendGroupName(hotel.getHotelName(), group.getGroupName()));
        }

        Hotel savedHotel = hotelRepository.save(hotel);
        return hotelConverter.toHotelResponse(savedHotel);
    }

    // --- 2. CHI TIẾT ---
    @Override
    public HotelResponse getHotel(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        HotelResponse response = hotelConverter.toHotelResponse(hotel);
        response.setHotelBedrooms(hotel.getHotelBedrooms());

        // Tính giá động nếu có Policy
        if (hotel.getHotelGroup() != null) {
            LocalDate today = LocalDate.now();
            List<HolidayPolicy> policies = holidayPolicyRepository
                    .findActivePolicies(hotel.getHotelGroup().getId(), today);

            if (!policies.isEmpty()) {
                HolidayPolicy policy = policies.get(0);
                double rate = 1.0 + (policy.getIncreasePercentage() / 100.0);

                Double oldHotelPrice = response.getHotelPriceFrom();
                response.setHotelPriceFrom(smartRoundPrice(oldHotelPrice * rate));

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

        Double oldPrice = hotel.getHotelPriceFrom();
        Double newPrice = hotelDTO.getPriceFrom();
        boolean isPriceChanged = newPrice != null && !newPrice.equals(oldPrice);

        hotel.setHotelName(hotelDTO.getHotelName());
        hotel.setHotelPriceFrom(newPrice);
        hotel.setAddress(hotelDTO.getAddress());
        hotel.setNumberFloor(hotelDTO.getNumberFloor());
        hotel.setNumberRoomPerFloor(hotelDTO.getNumberRoomPerFloor());

        if (hotelDTO.getHotelGroupId() != null) {
            HotelGroup group = hotelGroupRepository.findById(hotelDTO.getHotelGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found"));
            hotel.setHotelGroup(group);
            hotel.setHotelName(appendGroupName(hotel.getHotelName(), group.getGroupName()));
        }

        Hotel updatedHotel = hotelRepository.save(hotel);

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

    // =========================================================================
    //  [TÁCH BIỆT] 2 LOGIC TÌM KIẾM THEO YÊU CẦU
    // =========================================================================

    // CASE 1: Gợi ý theo Order (Chính xác địa điểm)
    @Override
    public List<HotelResponse> getHotelsByDestination(String destination) {
        // Dùng hàm findByDestination (cũ) của Repository để tìm đúng địa chỉ
        List<Hotel> hotels = hotelRepository.findByDestination(destination);
        LocalDate today = LocalDate.now();

        return hotels.stream()
                .filter(h -> !h.isDeleted()) // Đảm bảo không lấy ks đã xóa
                .map(hotel -> {
                    HotelResponse response = hotelConverter.toHotelResponse(hotel);
                    Double dynamicPrice = calculateDynamicPrice(hotel.getId(), today);
                    response.setHotelPriceFrom(dynamicPrice);
                    return response;
                })
                .collect(Collectors.toList());
    }

    // CASE 2: Tìm kiếm trên thanh Search (Đa năng: Tên, Group, Địa chỉ)
    @Override
    public List<HotelResponse> searchHotels(String keyword) {
        // Dùng hàm searchByKeyword (mới) của Repository
        List<Hotel> hotels = hotelRepository.searchByKeyword(keyword);
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

    // =========================================================================
    //  CÁC CHỨC NĂNG KHÁC
    // =========================================================================

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

    // --- 9. TÍNH GIÁ ĐỘNG (Helper) ---
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

        List<Hotel> hotels = hotelRepository.findAllByHotelGroupIdAndDeletedFalse(request.getGroupId());
        if (hotels.isEmpty()) {
            throw new AppException(ErrorCode.HOTEL_NOT_FOUND);
        }

        double rate = 1.0 + (request.getPercentage() / 100.0);

        for (Hotel hotel : hotels) {
            Double oldPrice = hotel.getHotelPriceFrom();
            hotel.setHotelPriceFrom(smartRoundPrice(oldPrice * rate));
        }
        hotelRepository.saveAll(hotels);

        List<Long> hotelIds = hotels.stream().map(Hotel::getId).collect(Collectors.toList());
        List<HotelBedroom> rooms = hotelBedroomRepository.findByHotelIdIn(hotelIds);

        for (HotelBedroom room : rooms) {
            Double oldRoomPrice = room.getPrice();
            room.setPrice(smartRoundPrice(oldRoomPrice * rate));
        }
        hotelBedroomRepository.saveAll(rooms);
    }
    // --- 12. CẬP NHẬT GIÁ THEO DANH SÁCH CHỌN (MỚI) ---
    @Override
    @Transactional
    public void bulkUpdatePriceByListIds(BulkUpdatePriceByListRequest request) {
        // 1. Kiểm tra dữ liệu đầu vào
        if (request.getHotelIds() == null || request.getHotelIds().isEmpty()) {
            throw new AppException(ErrorCode.HOTEL_NOT_FOUND);
        }
        if (request.getPercentage() == null) {
            throw new RuntimeException("Vui lòng nhập phần trăm điều chỉnh!");
        }
        if (request.getPercentage() <= -100) {
            throw new RuntimeException("Lỗi: Không thể giảm giá quá 100%!");
        }

        // 2. Lấy danh sách khách sạn
        List<Hotel> hotels = hotelRepository.findAllById(request.getHotelIds());

        // 3. Tính tỷ lệ (VD: 10% -> 1.1)
        double rate = 1.0 + (request.getPercentage() / 100.0);

        // 4. Duyệt và cập nhật
        for (Hotel hotel : hotels) {
            Double oldPrice = hotel.getHotelPriceFrom();
            Double newPrice = smartRoundPrice(oldPrice * rate); // Dùng hàm làm tròn có sẵn

            hotel.setHotelPriceFrom(newPrice);

            // 5. Cập nhật giá các phòng con (Bedroom)
            List<HotelBedroom> rooms = hotelBedroomRepository.findByHotelId(hotel.getId());
            for (HotelBedroom room : rooms) {
                double calculatedRoomPrice;
                // Giữ logic VIP tăng gấp rưỡi
                if ("Vip Room".equalsIgnoreCase(room.getRoomType())) {
                    calculatedRoomPrice = newPrice * 1.5;
                } else {
                    calculatedRoomPrice = newPrice;
                }
                room.setPrice(smartRoundPrice(calculatedRoomPrice));
            }
            hotelBedroomRepository.saveAll(rooms);
        }

        // 6. Lưu lại tất cả khách sạn
        hotelRepository.saveAll(hotels);
    }
}