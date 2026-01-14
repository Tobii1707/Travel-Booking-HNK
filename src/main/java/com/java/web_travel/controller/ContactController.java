package com.java.web_travel.controller;

import com.java.web_travel.model.request.ContactDTO;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.model.response.ContactResponse;
import com.java.web_travel.model.response.PageResponse;
import com.java.web_travel.entity.Contact;
import com.java.web_travel.service.ContactService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    @Autowired
    private ContactService contactService;

    // --- 1. API GỬI LIÊN HỆ (USER) ---
    @PostMapping("/send")
    public ApiResponse<Contact> sendContact(
            @RequestHeader("userId") Long userId,
            @Valid @RequestBody ContactDTO contactDTO
    ) {
        Contact savedContact = contactService.sendContact(userId, contactDTO);

        ApiResponse<Contact> response = new ApiResponse<>();
        response.setCode(1000);
        response.setMessage("Cảm ơn bạn đã gửi phản hồi!");
        response.setData(savedContact);
        return response;
    }

    // --- 2. API XEM DANH SÁCH (ADMIN) - ĐÃ SỬA ---
    // Thêm @RequestParam(required = false) String keyword
    @GetMapping("/admin/list")
    public ApiResponse<PageResponse<List<ContactResponse>>> getAllContacts(
            @RequestHeader("userId") Long userId,
            @RequestParam(required = false) String keyword, // <--- THÊM DÒNG NÀY (Có thể null)
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        // Truyền đủ 4 tham số xuống Service
        PageResponse<List<ContactResponse>> pageData = contactService.getAllContactsForAdmin(userId, keyword, pageNo, pageSize);

        ApiResponse<PageResponse<List<ContactResponse>>> response = new ApiResponse<>();
        response.setCode(1000);
        response.setMessage("Lấy danh sách phản hồi thành công");
        response.setData(pageData);

        return response;
    }

    // --- 3. API XEM LỊCH SỬ (USER) ---
    @GetMapping("/my-history")
    public ApiResponse<List<ContactResponse>> getMyContacts(
            @RequestHeader("userId") Long userId
    ) {
        List<ContactResponse> result = contactService.getUserContacts(userId);

        ApiResponse<List<ContactResponse>> response = new ApiResponse<>();
        response.setCode(1000);
        response.setMessage("Lấy lịch sử liên hệ thành công");
        response.setData(result);

        return response;
    }

    // --- 4. API TRẢ LỜI (ADMIN) ---
    @PutMapping("/{id}/reply")
    public ApiResponse<ContactResponse> replyContact(
            @RequestHeader("userId") Long adminId,
            @PathVariable Long id,
            @RequestBody String replyContent
    ) {
        ContactResponse result = contactService.replyContact(adminId, id, replyContent);

        ApiResponse<ContactResponse> response = new ApiResponse<>();
        response.setCode(1000);
        response.setMessage("Đã gửi câu trả lời thành công");
        response.setData(result);

        return response;
    }
}