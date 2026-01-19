package com.java.web_travel.service.impl;

import com.java.web_travel.convert.HotelConverter;
import com.java.web_travel.entity.Hotel;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.enums.OrderStatus; // Nhớ import Enum này
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.HotelDTO;
import com.java.web_travel.model.response.HotelResponse;
import com.java.web_travel.repository.HotelRepository;
import com.java.web_travel.repository.OrderRepository; // Nhớ import Repository này
import com.java.web_travel.service.HotelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Import Transactional

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HotelServiceImpl implements HotelService {

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private HotelConverter hotelConverter;

    @Autowired
    private OrderRepository orderRepository; // Inject thêm để check đơn hàng

    // --- 1. CHỨC NĂNG TẠO KHÁCH SẠN MỚI ---
    @Override
    @Transactional
    public HotelResponse createHotel(HotelDTO hotelDTO) {
        Hotel hotel = hotelConverter.convertHotel(hotelDTO);

        if(hotelDTO.getPriceFrom() < 0){
            throw new AppException(ErrorCode.PRICE_NOT_VALID);
        }

        Hotel savedHotel = hotelRepository.save(hotel);
        return hotelConverter.toHotelResponse(savedHotel);
    }

    // --- 2. CHỨC NĂNG LẤY CHI TIẾT 1 KHÁCH SẠN ---
    @Override
    public HotelResponse getHotel(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        // Nếu khách sạn đã xóa mềm, có thể chặn không cho xem chi tiết (Tùy logic)
        // if (hotel.isDeleted()) throw new AppException(ErrorCode.HOTEL_NOT_FOUND);

        return hotelConverter.toHotelResponse(hotel);
    }

    // --- 3. CHỨC NĂNG LẤY TẤT CẢ (CHỈ LẤY CÁI CHƯA XÓA) ---
    @Override
    public List<HotelResponse> getAllHotels() {
        // QUAN TRỌNG: Gọi hàm findAllByDeletedFalse trong Repository
        // Thay vì findAll()
        List<Hotel> hotels = hotelRepository.findAllByDeletedFalse();

        return hotels.stream()
                .map(hotel -> hotelConverter.toHotelResponse(hotel))
                .collect(Collectors.toList());
    }

    // --- 4. CHỨC NĂNG CẬP NHẬT ---
    @Override
    @Transactional
    public HotelResponse updateHotel(HotelDTO hotelDTO , Long hotelId){
        if(hotelDTO.getPriceFrom() < 0){
            throw new AppException(ErrorCode.PRICE_NOT_VALID);
        }

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        hotel.setHotelName(hotelDTO.getHotelName());
        hotel.setHotelPriceFrom(hotelDTO.getPriceFrom());
        hotel.setAddress(hotelDTO.getAddress());
        hotel.setNumberFloor(hotelDTO.getNumberFloor());
        hotel.setNumberRoomPerFloor(hotelDTO.getNumberRoomPerFloor());

        Hotel updatedHotel = hotelRepository.save(hotel);
        return hotelConverter.toHotelResponse(updatedHotel);
    }

    // --- 5. CHỨC NĂNG XÓA KHÁCH SẠN (LOGIC MỚI) ---
    @Override
    @Transactional
    public void deleteHotel(Long hotelId, boolean force) { // Thêm biến force
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        // Định nghĩa các trạng thái đang "Active"
        List<OrderStatus> activeStatuses = List.of(
                OrderStatus.PENDING,
                OrderStatus.PAID,
                OrderStatus.CONFIRMED
        );

        long activeOrdersCount = orderRepository.countActiveOrdersByHotel(hotelId, activeStatuses);

        if (activeOrdersCount > 0) {
            // TRƯỜNG HỢP 1: Không có cờ force (Xóa thường) -> Chặn
            if (!force) {
                throw new RuntimeException("CẢNH BÁO: Đang có " + activeOrdersCount + " đơn đặt phòng chưa hoàn thành. Bạn có muốn HỦY HẾT đơn hàng và xóa khách sạn không?");
            }

            // TRƯỜNG HỢP 2: Có cờ force (Xóa ép buộc) -> Hủy đơn hàng tự động
            // 1. Tìm các đơn hàng đó ra
            // (Bạn cần viết thêm hàm findAllActiveOrdersByHotel trong Repo hoặc dùng tạm logic này nếu lười)
            // Ở đây mình giả định bạn sẽ xử lý hủy đơn.
            // Cách nhanh nhất: Viết 1 câu Query update trong Repo
            orderRepository.cancelAllActiveOrdersByHotel(hotelId, activeStatuses, OrderStatus.CANCELLED);
        }

        // BƯỚC CUỐI: Xóa mềm khách sạn
        hotel.setDeleted(true);
        hotelRepository.save(hotel);
    }

    // --- 6. TÌM KIẾM (Cần lọc bỏ cái đã xóa) ---
    @Override
    public List<HotelResponse> getHotelsByDestination(String destination) {
        // Cách 1: Sửa Repository query thêm "AND h.deleted = false"
        // Cách 2: Lọc ở đây (Java Stream) - Dùng tạm cách này nếu chưa sửa Repo
        List<Hotel> hotels = hotelRepository.findByDestination(destination);

        return hotels.stream()
                .filter(h -> !h.isDeleted()) // Chỉ lấy cái chưa xóa
                .map(hotel -> hotelConverter.toHotelResponse(hotel))
                .collect(Collectors.toList());
    }

    // --- 7. MỚI: LẤY DANH SÁCH THÙNG RÁC ---
    @Override
    public List<HotelResponse> getDeletedHotels() {
        // Gọi hàm tìm cái đã xóa trong Repository
        List<Hotel> deletedHotels = hotelRepository.findAllByDeletedTrue();

        return deletedHotels.stream()
                .map(hotel -> hotelConverter.toHotelResponse(hotel))
                .collect(Collectors.toList());
    }

    // --- 8. MỚI: KHÔI PHỤC KHÁCH SẠN ---
    @Override
    @Transactional
    public void restoreHotel(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        // Set lại cờ deleted thành false
        hotel.setDeleted(false);

        hotelRepository.save(hotel);
    }
}