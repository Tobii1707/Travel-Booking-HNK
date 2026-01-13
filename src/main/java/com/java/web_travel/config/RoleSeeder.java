package com.java.web_travel.config;

import com.java.web_travel.entity.Role;
import com.java.web_travel.entity.User;
import com.java.web_travel.enums.RoleCode;
import com.java.web_travel.repository.RoleRepository;
import com.java.web_travel.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder; // Import thư viện mã hóa
import org.springframework.stereotype.Component;

import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

@Component
public class RoleSeeder implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    // Khai báo PasswordEncoder
    private final PasswordEncoder passwordEncoder;

    // Tiêm PasswordEncoder vào Constructor
    public RoleSeeder(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (roleRepository.count() == 0) {
            // Tạo và lưu role USER
            Role userRole = new Role(RoleCode.USER);
            roleRepository.save(userRole);

            // Tạo và lưu role ADMIN
            Role adminRole = new Role(RoleCode.ADMIN);
            roleRepository.save(adminRole);

            // Tạo và lưu user admin
            LocalDate localDate = LocalDate.of(2004, 7, 17);
            Date birthday = Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());

            // --- MÃ HÓA MẬT KHẨU TẠI ĐÂY ---
            User adminUser = new User(
                    "0123456789",
                    passwordEncoder.encode("123456"), // Mã hóa mật khẩu "123456"
                    "ADMIN",
                    "a@gmail.com",
                    birthday,
                    true
            );
            adminUser.setRole(adminRole);
            userRepository.save(adminUser);
        } else {
            // Nếu bảng roles đã có dữ liệu, kiểm tra và tạo user admin nếu chưa tồn tại
            Role adminRole = roleRepository.findByRoleCode(RoleCode.ADMIN)
                    .orElseThrow(() -> new RuntimeException("Role ADMIN not found"));

            if (userRepository.findByPhone("0123456789").isEmpty()) {
                LocalDate localDate = LocalDate.of(2004, 7, 17);
                Date birthday = Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());

                // --- MÃ HÓA MẬT KHẨU TẠI ĐÂY ---
                User adminUser = new User(
                        "0123456789",
                        passwordEncoder.encode("123456"), // Mã hóa mật khẩu "123456"
                        "ADMIN",
                        "a@gmail.com",
                        birthday,
                        true
                );
                adminUser.setRole(adminRole);
                userRepository.save(adminUser);
            }
        }
    }
}