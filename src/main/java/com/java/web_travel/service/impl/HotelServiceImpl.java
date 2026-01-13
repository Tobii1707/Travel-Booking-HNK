package com.java.web_travel.service.impl;

import com.java.web_travel.convert.HotelConverter;
import com.java.web_travel.entity.Hotel;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.HotelDTO;
import com.java.web_travel.repository.HotelRepository;
import com.java.web_travel.service.HotelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @Service: Annotation quan trọng nhất ở đây.
 * Nó báo cho Spring Boot biết: "Class này chứa logic nghiệp vụ, hãy quản lý nó".
 * Nếu thiếu dòng này, Controller sẽ không gọi được Service này (lỗi Bean not found).
 */
@Service
public class HotelServiceImpl implements HotelService {

    /**
     * @Autowired: Tiêm (Inject) Repository vào để dùng.
     * Service không tự mình kết nối DB, nó phải nhờ thằng Repository làm hộ.
     */
    @Autowired
    private HotelRepository hotelRepository;

    /**
     * @Autowired: Tiêm Converter.
     * Dùng để chuyển đổi qua lại giữa DTO (dữ liệu gửi lên) và Entity (dữ liệu lưu DB).
     */
    @Autowired
    private HotelConverter hotelConverter;


    // --- 1. CHỨC NĂNG TẠO KHÁCH SẠN MỚI ---
    @Override
    public Hotel createHotel(HotelDTO hotelDTO) {
        // Bước 1: Chuyển đổi dữ liệu từ 'hộp đóng gói' (DTO) sang 'hàng thật' (Entity)
        Hotel hotel = hotelConverter.convertHotel(hotelDTO);

        // Bước 2: Validate (Kiểm tra logic nghiệp vụ)
        // Nếu giá phòng nhỏ hơn 0 -> Báo lỗi ngay, không cho lưu.
        if(hotelDTO.getPriceFrom() < 0){
            // Ném ra ngoại lệ tùy chỉnh (AppException) với mã lỗi PRICE_NOT_VALID
            throw new AppException(ErrorCode.PRICE_NOT_VALID);
        }

        // Bước 3: Gọi Repository để lưu vào Database
        return hotelRepository.save(hotel);
    }

    // --- 2. CHỨC NĂNG LẤY CHI TIẾT 1 KHÁCH SẠN ---
    @Override
    public Hotel getHotel(Long hotelId) {
        // Logic: Tìm trong DB xem có ID này không.
        // .orElseThrow(...): Nếu tìm thấy thì trả về Hotel, nếu KHÔNG thấy thì ném lỗi HOTEL_NOT_FOUND.
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));
        return hotel;
    }

    // --- 3. CHỨC NĂNG LẤY TẤT CẢ DANH SÁCH ---
    @Override
    public List<Hotel> getAllHotels() {
        // Gọi hàm findAll() có sẵn của JpaRepository
        List<Hotel> hotels = hotelRepository.findAll();
        return hotels;
    }

    // --- 4. CHỨC NĂNG CẬP NHẬT (SỬA) KHÁCH SẠN ---
    @Override
    public Hotel updateHotel(HotelDTO hotelDTO , Long hotelId){
        // Bước 1: Kiểm tra giá hợp lệ trước (Logic giống hàm tạo mới)
        if(hotelDTO.getPriceFrom() < 0){
            throw new AppException(ErrorCode.PRICE_NOT_VALID);
        }

        // Bước 2: Kiểm tra xem khách sạn cần sửa có tồn tại không?
        // Phải lôi nó từ DB lên trước. Nếu không có thì báo lỗi, khỏi sửa.
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        // Bước 3: Cập nhật thông tin mới vào đối tượng cũ (Mapping)
        // Lấy thông tin từ DTO người dùng gửi lên, gán vào object lấy từ DB.
        hotel.setHotelName(hotelDTO.getHotelName());
        hotel.setHotelPriceFrom(hotelDTO.getPriceFrom());
        hotel.setAddress(hotelDTO.getAddress());

        // Bước 4: Lưu đè lại vào Database
        // Hàm save() trong JPA rất thông minh:
        // - Nếu object chưa có ID -> Tạo mới (Insert).
        // - Nếu object đã có ID -> Cập nhật (Update).
        return hotelRepository.save(hotel);
    }

    // --- 5. CHỨC NĂNG XÓA KHÁCH SẠN ---
    @Override
    public void deleteHotel(Long hotelId) {
        // Bước 1: Kiểm tra xem khách sạn có tồn tại không đã.
        // Không thể xóa một thứ không tồn tại -> Nếu không thấy thì báo lỗi.
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new AppException(ErrorCode.HOTEL_NOT_FOUND));

        // Bước 2: Nếu tồn tại rồi thì gọi lệnh xóa theo ID.
        hotelRepository.deleteById(hotelId);
    }

    // --- 6. CHỨC NĂNG TÌM KIẾM THEO ĐỊA ĐIỂM ---
    @Override
    public List<Hotel> getHotelsByDestination(String destination) {
        // Gọi cái hàm Custom Query (Native Query) mà bạn đã viết ở file HotelRepository
        // Hàm này xử lý vụ tìm kiếm "Ha Noi" hay "Hanoi" đều ra kết quả.
        return hotelRepository.findByDestination(destination);
    }
}