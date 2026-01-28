package com.java.web_travel.controller;

import com.java.web_travel.entity.User;
import com.java.web_travel.enums.RoleCode; // <--- CẦN IMPORT CÁI NÀY
import com.java.web_travel.model.request.ChangePassDTO;
import com.java.web_travel.model.request.ForgotPasswordDTO;
import com.java.web_travel.model.request.ResetPasswordDTO;
import com.java.web_travel.model.request.UserCreateDTO;
import com.java.web_travel.model.request.UserLoginDTO;
import com.java.web_travel.model.request.UserUpdateRequest;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.model.response.PageResponse;
import com.java.web_travel.service.PasswordResetService;
import com.java.web_travel.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/user")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/create")
    public ApiResponse<User> createUser(@Valid  @RequestBody UserCreateDTO userCreateDTO) {
        log.info("User created: " + userCreateDTO);
        ApiResponse<User> apiResponse = new ApiResponse<>();
        apiResponse.setData(userService.createUser(userCreateDTO));
        apiResponse.setMessage("create user success");
        log.info("User created: " + apiResponse);
        return apiResponse;
    }

    @PostMapping("/login")
    public ApiResponse<User> loginUser(@RequestBody UserLoginDTO userLoginDTO) {
        log.info("User login : " + userLoginDTO);
        ApiResponse<User> apiResponse = new ApiResponse<>();
        User user = userService.loginUser(userLoginDTO);
        apiResponse.setData(user);
        apiResponse.setMessage("login user success");

        // --- SỬA ĐOẠN NÀY ---
        // Cũ: if(user.getRole().getRoleCode().toString().equals("ADMIN"))
        // Mới: So sánh trực tiếp với Enum RoleCode.ADMIN
        if(user.getRole() == RoleCode.ADMIN){
            apiResponse.setCode(8888);
            apiResponse.setMessage("login admin success");
            log.info("Admin login success");
        }
        // --------------------

        return apiResponse;
    }

    @PatchMapping("/changePassword")
    public ApiResponse<User> changePassword(@Valid @RequestBody ChangePassDTO changePassDto) {
        log.info("User change password : " + changePassDto);
        userService.changePassword(changePassDto);
        log.info("User change password success");
        return new ApiResponse<>(1000,"success") ;
    }

    @GetMapping("/allUsers")
    public ApiResponse<PageResponse> getAllUsers(@RequestParam(defaultValue = "0",required = false) int pageNo,
                                                 @RequestParam(defaultValue = "5",required = false) int pageSize) {
        log.info("User getAllUsers , pageNo = {}, pageSize = {}", pageNo, pageSize);
        try{
            PageResponse<?> users = userService.getAllUsers(pageNo,pageSize) ;
            return new ApiResponse<>(1000,"get all users success",users);
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiResponse<>(7777,e.getMessage(),null);
        }
    }

    @GetMapping("/searchUser")
    public ApiResponse<PageResponse> searchUser(@RequestParam(defaultValue = "0",required = false) int pageNo,
                                                @RequestParam(defaultValue = "5",required = false) int pageSize,
                                                @RequestParam(required = false) String search) {
        log.info("User searchUser : " + search);
        try {
            PageResponse users = userService.findUserBySearch(pageNo,pageSize,search) ;
            return new ApiResponse<>(1000,"get search user success",users);
        } catch (Exception e) {
            log.error("bug : "+e.getMessage());
            return new ApiResponse<>(7777,e.getMessage(),null);
        }
    }

    @PatchMapping("/changeStatus/{id}")
    public ApiResponse<User> changeStatus(@PathVariable Long id) {
        log.info("User change status id = {} : ", id);
        ApiResponse<User> apiResponse = new ApiResponse<>();
        apiResponse.setData(userService.changeStatus(id));
        apiResponse.setMessage("change status success");
        log.info("User change status success");
        return apiResponse;
    }

    @GetMapping("/{id}")
    public ApiResponse<User> getUser(@PathVariable Long id) {
        log.info("User getUser : " + id);
        ApiResponse<User> apiResponse = new ApiResponse<>();
        apiResponse.setData(userService.findUserById(id));
        apiResponse.setMessage("get user success");
        log.info("User get success");
        return apiResponse;
    }

    @PutMapping("/update/{id}")
    public ApiResponse<User> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest user) {
        log.info("User update : " + user);
        ApiResponse<User> apiResponse = new ApiResponse<>();
        apiResponse.setData(userService.updateUser(id,user));
        apiResponse.setMessage("update user success");
        log.info("User update success");
        return apiResponse;
    }

    // ========================================================
    // ===          PHẦN THÊM MỚI (FORGOT PASSWORD)         ===
    // ========================================================

    // 1. API Gửi mail yêu cầu reset (Đã cập nhật dùng DTO JSON)
    @PostMapping("/forgot-password")
    public ApiResponse<String> forgotPassword(@Valid @RequestBody ForgotPasswordDTO request) {
        // Lấy email từ request body
        String email = request.getEmail();

        log.info("Request forgot password for email: " + email);

        // Gọi service
        passwordResetService.requestPasswordReset(email);

        return new ApiResponse<>(1000, "Đã gửi email hướng dẫn đổi mật khẩu", null);
    }

    // 2. API Kiểm tra Token (Frontend gọi cái này khi vừa load trang từ mail)
    @GetMapping("/validate-reset-token")
    public ApiResponse<Boolean> validateResetToken(@RequestParam String token) {
        log.info("Validating token: " + token);
        boolean isValid = passwordResetService.validateToken(token);

        if (isValid) {
            return new ApiResponse<>(1000, "Token valid", true);
        } else {
            return new ApiResponse<>(1001, "Token invalid", false);
        }
    }

    // 3. API Đổi mật khẩu (Frontend gọi cái này khi bấm Submit form đổi pass)
    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(@RequestBody ResetPasswordDTO resetPasswordDTO) {
        log.info("Processing reset password");
        passwordResetService.resetPassword(resetPasswordDTO);
        return new ApiResponse<>(1000, "Đổi mật khẩu thành công", null);
    }
}