package com.java.web_travel.service;

import com.java.web_travel.model.request.ContactDTO;
import com.java.web_travel.model.response.ContactResponse;
import com.java.web_travel.model.response.PageResponse;
import com.java.web_travel.entity.Contact;
import java.util.List;

public interface ContactService {

    Contact sendContact(Long userId, ContactDTO contactDTO);

    // --- XÓA DÒNG DƯỚI ĐÂY (Hàm cũ thiếu keyword) ---
    // PageResponse<List<ContactResponse>> getAllContactsForAdmin(Long requesterId, int pageNo, int pageSize);

    // --- GIỮ LẠI DÒNG NÀY (Hàm mới có keyword) ---
    PageResponse<List<ContactResponse>> getAllContactsForAdmin(Long requesterId, String keyword, int pageNo, int pageSize);

    ContactResponse replyContact(Long adminId, Long contactId, String replyContent);

    List<ContactResponse> getUserContacts(Long userId);
}