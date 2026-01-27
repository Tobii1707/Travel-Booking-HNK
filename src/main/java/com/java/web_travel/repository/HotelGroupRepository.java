package com.java.web_travel.repository;

import com.java.web_travel.entity.HotelGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HotelGroupRepository extends JpaRepository<HotelGroup, Long> {

    // Kiểm tra tên trùng (cho chức năng thêm/sửa)
    boolean existsByGroupName(String groupName);

    // Lấy danh sách chưa bị xóa
    List<HotelGroup> findAllByDeletedFalse();

    // Tìm theo ID mà chưa bị xóa
    Optional<HotelGroup> findByIdAndDeletedFalse(Long id);

    // Lấy danh sách ĐÃ bị xóa (cho thùng rác)
    List<HotelGroup> findAllByDeletedTrue();
}