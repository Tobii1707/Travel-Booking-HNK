package com.java.web_travel.service.impl;

import com.java.web_travel.convert.HotelConverter;
import com.java.web_travel.entity.*;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.enums.OrderStatus;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.*;
import com.java.web_travel.model.response.HotelHistoryResponse;
import com.java.web_travel.model.response.HotelResponse;
import com.java.web_travel.repository.*;
import com.java.web_travel.service.HotelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
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

    @Autowired private PriceChangeHistoryRepository priceChangeHistoryRepository;

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

    private void applyDynamicPriceToResponse(HotelResponse response, Hotel hotel) {
        LocalDate today = LocalDate.now();
        HolidayPolicy activePolicy = null;

        if (hotel.getHotelGroup() != null) {
            List<HolidayPolicy> groupPolicies = holidayPolicyRepository
                    .findActivePolicies(hotel.getHotelGroup().getId(), today);
            if (!groupPolicies.isEmpty()) {
                activePolicy = groupPolicies.get(0);
            }
        }

        if (activePolicy == null) {
            List<HolidayPolicy> individualPolicies = holidayPolicyRepository
                    .findActivePoliciesByHotel(hotel.getId(), today);
            if (!individualPolicies.isEmpty()) {
                activePolicy = individualPolicies.get(0);
            }
        }

        if (activePolicy != null) {
            double rate = 1.0 + (activePolicy.getIncreasePercentage() / 100.0);

            if (response.getHotelPriceFrom() != null) {
                response.setHotelPriceFrom(smartRoundPrice(response.getHotelPriceFrom() * rate));
            }

            if (response.getHotelBedrooms() != null && !response.getHotelBedrooms().isEmpty()) {
                for (HotelBedroom room : response.getHotelBedrooms()) {
                    if (room.getPrice() != null) {
                        room.setPrice(smartRoundPrice(room.getPrice() * rate));
                    }
                }
            }
        }
    }

    // =========================================================================
    //  CHỨC NĂNG CỐT LÕI (CRUD)
    // =========================================================================

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

    @Override
    public HotelResponse getHotel(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        HotelResponse response = hotelConverter.toHotelResponse(hotel);
        response.setHotelBedrooms(hotel.getHotelBedrooms());
        applyDynamicPriceToResponse(response, hotel);

        return response;
    }

    @Override
    public List<HotelResponse> getAllHotels() {
        List<Hotel> hotels = hotelRepository.findAllByDeletedFalse();

        return hotels.stream()
                .map(hotel -> {
                    HotelResponse response = hotelConverter.toHotelResponse(hotel);
                    if(response.getHotelBedrooms() == null || response.getHotelBedrooms().isEmpty()) {
                        response.setHotelBedrooms(hotel.getHotelBedrooms());
                    }
                    applyDynamicPriceToResponse(response, hotel);
                    return response;
                })
                .collect(Collectors.toList());
    }

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

            PriceChangeHistory log = new PriceChangeHistory();
            log.setHotel(updatedHotel);
            log.setOldPrice(oldPrice);
            log.setNewPrice(newPrice);
            log.setPercentage(0.0);
            log.setDescription("Cập nhật thủ công (Chi tiết khách sạn)");
            priceChangeHistoryRepository.save(log);
        }

        return hotelConverter.toHotelResponse(updatedHotel);
    }

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

    @Override
    public List<HotelResponse> getHotelsByDestination(String destination) {
        List<Hotel> hotels = hotelRepository.findByDestination(destination);
        return hotels.stream()
                .filter(h -> !h.isDeleted())
                .map(hotel -> {
                    HotelResponse response = hotelConverter.toHotelResponse(hotel);
                    if(response.getHotelBedrooms() == null) response.setHotelBedrooms(hotel.getHotelBedrooms());
                    applyDynamicPriceToResponse(response, hotel);
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<HotelResponse> searchHotels(String keyword) {
        List<Hotel> hotels = hotelRepository.searchByKeyword(keyword);
        return hotels.stream()
                .map(hotel -> {
                    HotelResponse response = hotelConverter.toHotelResponse(hotel);
                    if(response.getHotelBedrooms() == null) response.setHotelBedrooms(hotel.getHotelBedrooms());
                    applyDynamicPriceToResponse(response, hotel);
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<HotelResponse> getDeletedHotels() {
        List<Hotel> deletedHotels = hotelRepository.findAllByDeletedTrue();
        return deletedHotels.stream()
                .map(hotel -> hotelConverter.toHotelResponse(hotel))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void restoreHotel(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));
        hotel.setDeleted(false);
        hotelRepository.save(hotel);
    }

    @Override
    public Double calculateDynamicPrice(Long hotelId, LocalDate dateToCheck) {
        Hotel hotel = hotelRepository.findById(hotelId).orElse(null);
        if (hotel == null) return 0.0;
        Double basePrice = hotel.getHotelPriceFrom();
        if (hotel.getHotelGroup() != null) {
            List<HolidayPolicy> groupPolicies = holidayPolicyRepository
                    .findActivePolicies(hotel.getHotelGroup().getId(), dateToCheck);
            if (!groupPolicies.isEmpty()) {
                double surcharge = basePrice * (groupPolicies.get(0).getIncreasePercentage() / 100.0);
                return smartRoundPrice(basePrice + surcharge);
            }
        }
        List<HolidayPolicy> individualPolicies = holidayPolicyRepository
                .findActivePoliciesByHotel(hotelId, dateToCheck);
        if (!individualPolicies.isEmpty()) {
            double surcharge = basePrice * (individualPolicies.get(0).getIncreasePercentage() / 100.0);
            return smartRoundPrice(basePrice + surcharge);
        }
        return basePrice;
    }

    // [ĐÃ XÓA] Hàm calculateTotalPrice và getPolicyForDate đã được xóa khỏi đây.

    // =========================================================================
    //  QUẢN LÝ GROUP & GIÁ
    // =========================================================================

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

        List<PriceChangeHistory> historyLogs = new ArrayList<>();

        for (Hotel hotel : hotels) {
            Double oldPrice = hotel.getHotelPriceFrom();
            Double newPrice = smartRoundPrice(oldPrice * rate);

            hotel.setHotelPriceFrom(newPrice);

            PriceChangeHistory log = new PriceChangeHistory();
            log.setHotel(hotel);
            log.setOldPrice(oldPrice);
            log.setNewPrice(newPrice);
            log.setPercentage(Double.valueOf(request.getPercentage()));
            log.setDescription("Cập nhật theo Nhóm (Permanent)");
            historyLogs.add(log);
        }
        hotelRepository.saveAll(hotels);

        List<Long> hotelIds = hotels.stream().map(Hotel::getId).collect(Collectors.toList());
        List<HotelBedroom> rooms = hotelBedroomRepository.findByHotelIdIn(hotelIds);
        for (HotelBedroom room : rooms) {
            Double oldRoomPrice = room.getPrice();
            room.setPrice(smartRoundPrice(oldRoomPrice * rate));
        }
        hotelBedroomRepository.saveAll(rooms);

        priceChangeHistoryRepository.saveAll(historyLogs);
    }

    @Override
    @Transactional
    public void bulkUpdatePriceByListIds(BulkUpdatePriceByListRequest request) {
        if (request.getHotelIds() == null || request.getHotelIds().isEmpty()) {
            throw new AppException(ErrorCode.HOTEL_NOT_FOUND);
        }
        if (request.getPercentage() == null) {
            throw new RuntimeException("Vui lòng nhập phần trăm điều chỉnh!");
        }
        if (request.getPercentage() <= -100) {
            throw new RuntimeException("Lỗi: Không thể giảm giá quá 100%!");
        }

        List<Hotel> hotels = hotelRepository.findAllById(request.getHotelIds());
        double rate = 1.0 + (request.getPercentage() / 100.0);

        List<PriceChangeHistory> historyLogs = new ArrayList<>();

        for (Hotel hotel : hotels) {
            Double oldPrice = hotel.getHotelPriceFrom();
            Double newPrice = smartRoundPrice(oldPrice * rate);

            hotel.setHotelPriceFrom(newPrice);

            PriceChangeHistory log = new PriceChangeHistory();
            log.setHotel(hotel);
            log.setOldPrice(oldPrice);
            log.setNewPrice(newPrice);
            log.setPercentage(Double.valueOf(request.getPercentage()));
            log.setDescription("Cập nhật theo Danh sách chọn (Permanent)");
            historyLogs.add(log);

            List<HotelBedroom> rooms = hotelBedroomRepository.findByHotelId(hotel.getId());
            for (HotelBedroom room : rooms) {
                double calculatedRoomPrice;
                if ("Vip Room".equalsIgnoreCase(room.getRoomType())) {
                    calculatedRoomPrice = newPrice * 1.5;
                } else {
                    calculatedRoomPrice = newPrice;
                }
                room.setPrice(smartRoundPrice(calculatedRoomPrice));
            }
            hotelBedroomRepository.saveAll(rooms);
        }
        hotelRepository.saveAll(hotels);

        priceChangeHistoryRepository.saveAll(historyLogs);
    }

    @Override
    @Transactional
    public void addPolicyToSelectedHotels(AddPolicyToHotelsRequest request) {
        if (request.getHotelIds() == null || request.getHotelIds().isEmpty()) {
            throw new RuntimeException("Danh sách khách sạn trống!");
        }
        if (request.getPercentage() == null) {
            throw new RuntimeException("Chưa nhập phần trăm tăng/giảm!");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new RuntimeException("Ngày bắt đầu và kết thúc không được để trống!");
        }
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new RuntimeException("Lỗi: Ngày bắt đầu (" + request.getStartDate() +
                    ") không được nằm sau ngày kết thúc (" + request.getEndDate() + ")!");
        }

        List<Hotel> hotels = hotelRepository.findAllById(request.getHotelIds());
        if (hotels.isEmpty()) {
            throw new AppException(ErrorCode.HOTEL_NOT_FOUND);
        }

        for (Hotel hotel : hotels) {
            if (hotel.getHotelGroup() != null) {
                boolean groupHasPolicy = holidayPolicyRepository.existsOverlappingPolicy(
                        hotel.getHotelGroup().getId(),
                        request.getStartDate(),
                        request.getEndDate()
                );

                if (groupHasPolicy) {
                    throw new RuntimeException("Lỗi xung đột: Nhóm khách sạn '" + hotel.getHotelGroup().getGroupName() +
                            "' đã có chính sách giá áp dụng trong khoảng thời gian này (" + request.getStartDate() +
                            " đến " + request.getEndDate() + "). Khách sạn con không được phép ghi đè!");
                }
            }

            boolean existsOverlap = holidayPolicyRepository.existsOverlappingPolicyForHotel(
                    hotel.getId(),
                    request.getStartDate(),
                    request.getEndDate()
            );

            if (existsOverlap) {
                throw new RuntimeException("Lỗi: Khách sạn '" + hotel.getHotelName() +
                        "' đã có chính sách giá trong khoảng thời gian từ " +
                        request.getStartDate() + " đến " + request.getEndDate() +
                        ". Vui lòng chọn ngày khác hoặc xóa chính sách cũ!");
            }

            HolidayPolicy policy = new HolidayPolicy();
            policy.setHotel(hotel);
            policy.setTargetGroup(null);
            policy.setName(request.getPolicyName());
            policy.setStartDate(request.getStartDate());
            policy.setEndDate(request.getEndDate());
            policy.setIncreasePercentage(Double.valueOf(request.getPercentage()));
            holidayPolicyRepository.save(policy);
        }
    }

    // =========================================================================
    //  [MỚI] LẤY LỊCH SỬ TỔNG HỢP (CHÍNH SÁCH + GIÁ VĨNH VIỄN)
    // =========================================================================

    @Override
    public List<HotelHistoryResponse> getPolicyHistoryByHotel(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        List<HotelHistoryResponse> fullHistory = new ArrayList<>();

        List<HolidayPolicy> policies = holidayPolicyRepository.findByHotelIdOrderByStartDateDesc(hotelId);
        for (HolidayPolicy p : policies) {
            HotelHistoryResponse dto = new HotelHistoryResponse();
            dto.setType("POLICY");
            dto.setName(p.getName());
            dto.setPercentage(p.getIncreasePercentage());
            dto.setStartDate(p.getStartDate().toString());
            dto.setEndDate(p.getEndDate().toString());
            dto.setCreatedAt(p.getStartDate().atStartOfDay());
            dto.setId(p.getId());

            fullHistory.add(dto);
        }

        List<PriceChangeHistory> changes = priceChangeHistoryRepository.findByHotelIdOrderByChangeDateDesc(hotelId);
        for (PriceChangeHistory c : changes) {
            HotelHistoryResponse dto = new HotelHistoryResponse();
            dto.setType("PERMANENT");
            dto.setName(c.getDescription());
            dto.setPercentage(c.getPercentage());
            dto.setOldPrice(c.getOldPrice());
            dto.setNewPrice(c.getNewPrice());
            dto.setCreatedAt(c.getChangeDate());
            dto.setId(c.getId());

            fullHistory.add(dto);
        }

        fullHistory.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        return fullHistory;
    }

    // =========================================================================
    //  QUẢN LÝ CHÍNH SÁCH (UPDATE / DELETE)
    // =========================================================================

    @Override
    @Transactional
    public void updateHolidayPolicy(Long policyId, UpdatePolicyListHotelRequest request) {
        HolidayPolicy policy = holidayPolicyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy chính sách (ID: " + policyId + ")"));

        LocalDate newStart = request.getStartDate() != null ? request.getStartDate() : policy.getStartDate();
        LocalDate newEnd = request.getEndDate() != null ? request.getEndDate() : policy.getEndDate();

        if (newStart.isAfter(newEnd)) {
            throw new RuntimeException("Lỗi: Ngày bắt đầu không được nằm sau ngày kết thúc!");
        }

        boolean isDatesChanged = !newStart.equals(policy.getStartDate()) || !newEnd.equals(policy.getEndDate());

        if (isDatesChanged) {
            Hotel hotel = policy.getHotel();
            if (hotel != null && hotel.getHotelGroup() != null) {
                boolean groupHasPolicy = holidayPolicyRepository.existsOverlappingPolicy(
                        hotel.getHotelGroup().getId(),
                        newStart,
                        newEnd
                );

                if (groupHasPolicy) {
                    throw new RuntimeException("Lỗi xung đột: Nhóm khách sạn '" + hotel.getHotelGroup().getGroupName() +
                            "' đã có chính sách giá trong khoảng thời gian mới này. Không thể cập nhật!");
                }
            }

            boolean isOverlapped = holidayPolicyRepository.existsOverlappingExcludingSelf(
                    policy.getHotel().getId(),
                    policyId,
                    newStart,
                    newEnd
            );

            if (isOverlapped) {
                throw new RuntimeException("Lỗi: Khoảng thời gian mới bị trùng với một chính sách khác đang có hiệu lực!");
            }
        }

        if(request.getPolicyName() != null) policy.setName(request.getPolicyName());
        if(request.getPercentage() != null) policy.setIncreasePercentage(request.getPercentage());
        if(request.getStartDate() != null) policy.setStartDate(request.getStartDate());
        if(request.getEndDate() != null) policy.setEndDate(request.getEndDate());

        holidayPolicyRepository.save(policy);
    }

    @Override
    @Transactional
    public void deleteHolidayPolicy(Long policyId) {
        if (!holidayPolicyRepository.existsById(policyId)) {
            throw new RuntimeException("Lỗi: Chính sách không tồn tại hoặc đã bị xóa!");
        }
        holidayPolicyRepository.deleteById(policyId);
    }
}