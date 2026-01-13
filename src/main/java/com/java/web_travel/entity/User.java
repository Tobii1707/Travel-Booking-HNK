package com.java.web_travel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;
import java.util.List;

@Entity
@Table(
        name = "users",
        indexes = { @Index(name = "idx_users_role_id", columnList = "role_id") }
)
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

    @ManyToOne(cascade = CascadeType.PERSIST, fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    @JsonIgnore
    private Role role;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Order> order;

    public User(String phone, String password, String fullName, String email, Date birthday, boolean status, Role role) {
        this.phone = phone;
        this.password = password;
        this.fullName = fullName;
        this.email = email;
        this.birthday = birthday;
        this.status = status;
        this.role = role;
    }

    public User(String phone, String password, String fullName, String email, Date birthday, boolean status) {
        this.phone = phone;
        this.password = password;
        this.fullName = fullName;
        this.email = email;
        this.birthday = birthday;
        this.status = status;
    }

    public User(String phone, String password, Role role) {
        this.phone = phone;
        this.password = password;
        this.role = role;
    }
}
