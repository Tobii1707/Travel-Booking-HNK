# ✈️ Travel Booking Website

> Hệ thống đặt tour du lịch, vé máy bay và khách sạn trực tuyến. Đồ án cơ sở ngành Công nghệ Thông tin - Đại học Phenikaa.

![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)

## 📖 Giới thiệu
Dự án xây dựng một hệ thống thương mại điện tử phục vụ nhu cầu du lịch toàn diện. Hệ thống cho phép người dùng đặt Tour, vé máy bay, khách sạn và tương tác với ban quản trị. Đồng thời cung cấp trang quản trị (Admin Dashboard) mạnh mẽ để quản lý toàn bộ dịch vụ và người dùng.

## 🚀 Tính năng chính

### 👤 Khách hàng (User)
* **Tài khoản:**
    * Đăng ký/Đăng nhập hệ thống.
    * **Bảo mật:** Mật khẩu người dùng được mã hóa trước khi lưu vào cơ sở dữ liệu.
* **Đặt dịch vụ (Booking):**
    * **Đặt Tour:** Đặt các tour du lịch (chọn địa điểm, số lượng người, ngày check-in, check-out,...).
    * **Đặt Chuyến bay:** Tìm kiếm và đặt vé máy bay.
    * **Đặt Khách sạn:** Tìm kiếm và đặt phòng khách sạn.
* **Thanh toán:**
    * Quy trình thanh toán thủ công (Chuyển khoản/Tiền mặt), trạng thái đơn hàng sẽ được cập nhật sau khi Admin xác nhận.
* **Tương tác:**
    * **Liên hệ:** Gửi tin nhắn liên hệ/hỗ trợ tới quản trị viên.
    * **Đánh giá:** Viết đánh giá (Review) cho các tour đã tham gia.

### 🛠 Quản trị viên (Admin) & Nhân viên
* **Quản lý Tài khoản:**
    * **User:** Xem danh sách, thực hiện **Khóa (Lock)** hoặc **Mở khóa (Unlock)** tài khoản người dùng vi phạm.
    * **Nhân viên:** Tạo tài khoản nhân viên mới với vai trò và quyền hạn tương đương Admin để hỗ trợ quản lý.
* **Quản lý Dịch vụ (CRUD):**
    * **Chuyến bay:** Thêm, sửa, xóa thông tin chuyến bay.
    * **Khách sạn:** Thêm, sửa, xóa thông tin khách sạn.
* **Quản lý Đơn hàng:**
    * Xem danh sách các đơn đặt (Booking).
    * **Xác nhận:** Duyệt các đơn đặt tour/vé/phòng mà User đã đặt.
* **Chăm sóc khách hàng:**
    * **Liên hệ:** Xem danh sách liên hệ, trả lời (Reply) trực tiếp cho User.
    * **Đánh giá:** Xem và quản lý các đánh giá của khách hàng về Tour.

## 🛠 Công nghệ sử dụng
* **Backend:** Java 17, Spring Boot (Spring MVC, Spring Data JPA, Spring Security).
* **Frontend:** HTML5, CSS3, JavaScript, Bootstrap, Thymeleaf.
* **Database:** MySQL.
* **Tools:** IntelliJ IDEA, Maven, Git, Postman.

## ⚙️ Cài đặt và Chạy dự án

**Yêu cầu:** JDK 17+, MySQL, Maven.

1.  **Clone dự án:**
    ```bash
    git clone [https://github.com/Tobii1707/Web-travel-booking.git](https://github.com/Tobii1707/Web-travel-booking.git)
    cd Web-travel-booking
    ```

2.  **Cấu hình Database:**
    * Tạo database tên `travel_booking` trong MySQL.
    * Mở file `src/main/resources/application.properties` và chỉnh sửa username/password của bạn:
    ```properties
    spring.datasource.url=jdbc:mysql://localhost:3306/travel_booking
    spring.datasource.username=root
    spring.datasource.password=your_password
    ```

3.  **Chạy ứng dụng:**
    ```bash
    mvn spring-boot:run
    ```
    Hoặc chạy file `TravelBookingApplication.java` trong IntelliJ IDEA.

4.  **Truy cập:**
    * Trang chủ: `http://localhost:8080/home`
    * Admin: `http://localhost:8080/admin`

## 👨‍💻 Tác giả
Dự án được thực hiện và phát triển bởi:
* **Hà Nam Khánh**: Fullstack Developer (Backend, Frontend, Database, System Design).

---
*Created by Hà Nam Khánh - 2025*
