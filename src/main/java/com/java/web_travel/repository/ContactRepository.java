package com.java.web_travel.repository;

import com.java.web_travel.entity.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    // Lấy lịch sử contact của 1 user cụ thể
    List<Contact> findByUser_IdOrderByCreatedAtDesc(Long userId);

    // --- TÌM KIẾM (ADMIN) ---
    // Tìm kiếm Contact dựa trên keyword (Tên, Email hoặc Tiêu đề)
    // Logic: Nếu keyword null hoặc rỗng -> Trả về tất cả
    //        Nếu có keyword -> Tìm theo Tên OR Email OR Tiêu đề (không phân biệt hoa thường)
    @Query("SELECT c FROM Contact c WHERE " +
            "(:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(c.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.subject) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Contact> searchContacts(@Param("keyword") String keyword, Pageable pageable);
}