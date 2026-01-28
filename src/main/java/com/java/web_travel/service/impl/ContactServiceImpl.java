package com.java.web_travel.service.impl;

import com.java.web_travel.entity.Contact;
import com.java.web_travel.entity.User;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.enums.RoleCode; // Import Enum RoleCode
import com.java.web_travel.exception.AppException;
import com.java.web_travel.model.request.ContactDTO;
import com.java.web_travel.model.response.ContactResponse;
import com.java.web_travel.model.response.PageResponse;
import com.java.web_travel.repository.ContactRepository;
import com.java.web_travel.repository.UserRepository;
import com.java.web_travel.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ContactServiceImpl implements ContactService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContactRepository contactRepository;

    @Override
    @Transactional
    public Contact sendContact(Long userId, ContactDTO contactDTO) {
        // 1. Kiểm tra User tồn tại
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

        if (!user.isStatus()) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_ACTIVE);
        }

        // --- SỬA ĐOẠN NÀY ---
        // Cũ: if (user.getRole() != null && user.getRole().getRoleCode() == RoleCode.ADMIN)
        // Mới: So sánh trực tiếp Enum
        if (user.getRole() == RoleCode.ADMIN) {
            throw new AppException(ErrorCode.ADMIN_CANNOT_SEND_MESSAGE);
        }
        // --------------------

        // --- [MỚI] KIỂM TRA DỮ LIỆU CÓ KHỚP VỚI USER KHÔNG ---
        // Kiểm tra Họ tên
        if (!Objects.equals(user.getFullName(), contactDTO.getFullName())) {
            // Thay RuntimeException bằng AppException
            throw new AppException(ErrorCode.USER_INFO_NOT_MATCH);
        }

        // Kiểm tra Email
        if (!Objects.equals(user.getEmail(), contactDTO.getEmail())) {
            // Thay RuntimeException bằng AppException
            throw new AppException(ErrorCode.EMAIL_NOT_MATCH);
        }
        // -------------------------------------------------------

        // 2. Tạo Entity Contact mới
        Contact contact = new Contact();
        contact.setUser(user);

        // Gán dữ liệu (lúc này đã đảm bảo giống User rồi)
        contact.setFullName(contactDTO.getFullName());
        contact.setEmail(contactDTO.getEmail());
        contact.setSubject(contactDTO.getSubject());
        contact.setMessage(contactDTO.getMessage());

        contact.setCreatedAt(LocalDateTime.now());

        return contactRepository.save(contact);
    }

    @Override
    public PageResponse<List<ContactResponse>> getAllContactsForAdmin(Long requesterId, String keyword, int pageNo, int pageSize) {
        User user = userRepository.findById(requesterId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

        // --- SỬA ĐOẠN NÀY ---
        // Cũ: if (user.getRole() == null || user.getRole().getRoleCode() != RoleCode.ADMIN)
        // Mới: So sánh trực tiếp Enum
        if (user.getRole() != RoleCode.ADMIN) {
            throw new RuntimeException("Bạn không có quyền truy cập chức năng này");
        }
        // --------------------

        Pageable pageable = PageRequest.of(pageNo, pageSize, Sort.by("createdAt").descending());
        String searchKey = (keyword != null && !keyword.isEmpty()) ? keyword.trim() : null;

        Page<Contact> pageResult = contactRepository.searchContacts(searchKey, pageable);

        List<ContactResponse> items = pageResult.getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return PageResponse.<List<ContactResponse>>builder()
                .pageNo(pageNo)
                .pageSize(pageSize)
                .totalPages(pageResult.getTotalPages())
                .items(items)
                .build();
    }

    @Override
    @Transactional
    public ContactResponse replyContact(Long adminId, Long contactId, String replyContent) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

        // --- SỬA ĐOẠN NÀY ---
        // Cũ: if (admin.getRole().getRoleCode() != RoleCode.ADMIN)
        // Mới: So sánh trực tiếp Enum
        if (admin.getRole() != RoleCode.ADMIN) {
            throw new RuntimeException("Chỉ Admin mới được trả lời liên hệ");
        }
        // --------------------

        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy liên hệ"));

        contact.setReplyNote(replyContent);
        contact.setRepliedAt(LocalDateTime.now());

        Contact savedContact = contactRepository.save(contact);

        return convertToResponse(savedContact);
    }

    @Override
    public List<ContactResponse> getUserContacts(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.USER_NOT_EXISTS);
        }

        List<Contact> contacts = contactRepository.findByUser_IdOrderByCreatedAtDesc(userId);

        if (contacts.isEmpty()) {
            return Collections.emptyList();
        }

        return contacts.stream()
                .map(contact -> ContactResponse.builder()
                        .id(contact.getId())
                        .subject(contact.getSubject())
                        .message(contact.getMessage())
                        .createdAt(contact.getCreatedAt())
                        .replyNote(contact.getReplyNote())
                        .repliedAt(contact.getRepliedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private ContactResponse convertToResponse(Contact contact) {
        return ContactResponse.builder()
                .id(contact.getId())
                .fullName(contact.getFullName())
                .email(contact.getEmail())
                .subject(contact.getSubject())
                .message(contact.getMessage())
                .createdAt(contact.getCreatedAt())
                .replyNote(contact.getReplyNote())
                .repliedAt(contact.getRepliedAt())
                .build();
    }
}