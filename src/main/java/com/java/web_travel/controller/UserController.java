package com.java.web_travel.controller;

import com.java.web_travel.entity.User;
import com.java.web_travel.model.request.ChangePassDTO;
import com.java.web_travel.model.request.ForgotPasswordDTO;
import com.java.web_travel.model.request.ResetPasswordDTO;
import com.java.web_travel.model.request.UserCreateDTO;
import com.java.web_travel.model.request.UserLoginDTO;
import com.java.web_travel.model.request.UserUpdateRequest;
import com.java.web_travel.model.response.ApiReponse;
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
    public ApiReponse<User> createUser(@Valid  @RequestBody UserCreateDTO userCreateDTO) {
        log.info("User created: " + userCreateDTO);
        ApiReponse<User> apiReponse = new ApiReponse<>();
        apiReponse.setData(userService.createUser(userCreateDTO));
        apiReponse.setMessage("create user success");
        log.info("User created: " + apiReponse);
        return apiReponse;
    }

    @PostMapping("/login")
    public ApiReponse<User> loginUser(@RequestBody UserLoginDTO userLoginDTO) {
        log.info("User login : " + userLoginDTO);
        ApiReponse<User> apiReponse = new ApiReponse<>();
        User user = userService.loginUser(userLoginDTO);
        apiReponse.setData(user);
        apiReponse.setMessage("login user success");
        if(user.getRole().getRoleCode().toString().equals("ADMIN")){
            apiReponse.setCode(8888);
            apiReponse.setMessage("login admin success");
            log.info("Admin login success");
        }
        return apiReponse;
    }

    @PatchMapping("/changePassword")
    public ApiReponse<User> changePassword(@Valid @RequestBody ChangePassDTO changePassDto) {
        log.info("User change password : " + changePassDto);
        userService.changePassword(changePassDto);
        log.info("User change password success");
        return new ApiReponse<>(1000,"success") ;
    }

    @GetMapping("/allUsers")
    public ApiReponse<PageResponse> getAllUsers(@RequestParam(defaultValue = "0",required = false) int pageNo,
                                                @RequestParam(defaultValue = "5",required = false) int pageSize) {
        log.info("User getAllUsers , pageNo = {}, pageSize = {}", pageNo, pageSize);
        try{
            PageResponse<?> users = userService.getAllUsers(pageNo,pageSize) ;
            return new ApiReponse<>(1000,"get all users success",users);
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ApiReponse<>(7777,e.getMessage(),null);
        }
    }

    @GetMapping("/searchUser")
    public ApiReponse<PageResponse> searchUser(@RequestParam(defaultValue = "0",required = false) int pageNo,
                                               @RequestParam(defaultValue = "5",required = false) int pageSize,
                                               @RequestParam(required = false) String search) {
        log.info("User searchUser : " + search);
        try {
            PageResponse users = userService.findUserBySearch(pageNo,pageSize,search) ;
            return new ApiReponse<>(1000,"get search user success",users);
        } catch (Exception e) {
            log.error("bug : "+e.getMessage());
            return new ApiReponse<>(7777,e.getMessage(),null);
        }
    }

    @PatchMapping("/changeStatus/{id}")
    public ApiReponse<User> changeStatus(@PathVariable Long id) {
        log.info("User change status id = {} : ", id);
        ApiReponse<User> apiReponse = new ApiReponse<>();
        apiReponse.setData(userService.changeStatus(id));
        apiReponse.setMessage("change status success");
        log.info("User change status success");
        return apiReponse;
    }

    @GetMapping("/{id}")
    public ApiReponse<User> getUser(@PathVariable Long id) {
        log.info("User getUser : " + id);
        ApiReponse<User> apiReponse = new ApiReponse<>();
        apiReponse.setData(userService.findUserById(id));
        apiReponse.setMessage("get user success");
        log.info("User get success");
        return apiReponse;
    }

    @PutMapping("/update/{id}")
    public ApiReponse<User> updateUser(@PathVariable Long id,@Valid @RequestBody UserUpdateRequest user) {
        log.info("User update : " + user);
        ApiReponse<User> apiReponse = new ApiReponse<>();
        apiReponse.setData(userService.updateUser(id,user));
        apiReponse.setMessage("update user success");
        log.info("User update success");
        return apiReponse;
    }

    // ========================================================
    // ===          PHẦN THÊM MỚI (FORGOT PASSWORD)         ===
    // ========================================================

    // 1. API Gửi mail yêu cầu reset (Đã cập nhật dùng DTO JSON)
    @PostMapping("/forgot-password")
    public ApiReponse<String> forgotPassword(@Valid @RequestBody ForgotPasswordDTO request) {
        // Lấy email từ request body
        String email = request.getEmail();

        log.info("Request forgot password for email: " + email);

        // Gọi service
        passwordResetService.requestPasswordReset(email);

        return new ApiReponse<>(1000, "Đã gửi email hướng dẫn đổi mật khẩu", null);
    }

    // 2. API Kiểm tra Token (Frontend gọi cái này khi vừa load trang từ mail)
    @GetMapping("/validate-reset-token")
    public ApiReponse<Boolean> validateResetToken(@RequestParam String token) {
        log.info("Validating token: " + token);
        boolean isValid = passwordResetService.validateToken(token);

        if (isValid) {
            return new ApiReponse<>(1000, "Token valid", true);
        } else {
            return new ApiReponse<>(1001, "Token invalid", false);
        }
    }

    // 3. API Đổi mật khẩu (Frontend gọi cái này khi bấm Submit form đổi pass)
    @PostMapping("/reset-password")
    public ApiReponse<String> resetPassword(@RequestBody ResetPasswordDTO resetPasswordDTO) {
        log.info("Processing reset password");
        passwordResetService.resetPassword(resetPasswordDTO);
        return new ApiReponse<>(1000, "Đổi mật khẩu thành công", null);
    }
}