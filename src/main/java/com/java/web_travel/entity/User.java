package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.java.web_travel.enums.RoleCode; // Import Enum của bạn
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "users")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "phone", unique = true, nullable = false, length = 30)
    private String phone;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Temporal(TemporalType.DATE)
    @Column(name = "birthday")
    private Date birthday;

    @Column(name = "status", nullable = false)
    private boolean status;

    // --- SỬA ĐOẠN NÀY ---
    // Thay vì @ManyToOne nối bảng, ta lưu thẳng chuỗi (VD: "ADMIN") vào cột này
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private RoleCode role;
    // --------------------

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Order> order;

    // Cập nhật lại các Constructor cho gọn
    public User(String phone, String password, String fullName, String email, Date birthday, boolean status, RoleCode role) {
        this.phone = phone;
        this.password = password;
        this.fullName = fullName;
        this.email = email;
        this.birthday = birthday;
        this.status = status;
        this.role = role;
    }

    public User(String phone, String password, RoleCode role) {
        this.phone = phone;
        this.password = password;
        this.role = role;
    }
}