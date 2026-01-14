package com.java.web_travel.controller.admin;

import com.java.web_travel.model.request.UserCreateDTO;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@Slf4j

public class AdminController {

    @Autowired
    private UserService userService;

    @PostMapping("/acc")
    public ApiResponse createAdmin(@RequestBody @Valid UserCreateDTO userCreateDTO) {
        // @RequestBody: Nhận dữ liệu JSON từ Frontend (username, password...) ép vào object userCreateDTO.
        // @Valid: Kiểm tra dữ liệu ngay lập tức (VD: password có đủ 6 ký tự không, email đúng định dạng không...).
        // Nếu sai, nó trả lỗi ngay, không chạy tiếp dòng dưới.

        // Ghi log để biết có ai đó đang gọi hàm này với dữ liệu gì
        log.info("Start createAdmin : {}", userCreateDTO);

        // Tạo đối tượng phản hồi chuẩn
        ApiResponse apiResponse = new ApiResponse();

        // 1. Gọi Service để thực hiện logic tạo Admin (userService.createAdmin)
        // 2. Lấy kết quả trả về từ Service gán vào phần Data của response
        apiResponse.setData(userService.createAdmin(userCreateDTO));

        // Mặc định ApiReponse có code=1000 và message="Success" (do constructor mặc định),
        // nên nếu không có lỗi gì thì trả về luôn.
        return apiResponse;
    }
}