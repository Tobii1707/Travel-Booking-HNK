package com.java.web_travel.config;

import com.java.web_travel.entity.User;
import com.java.web_travel.enums.RoleCode;
import com.java.web_travel.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

@Component
public class RoleSeeder implements ApplicationRunner {

    // Bỏ RoleRepository vì không còn bảng Role
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Cập nhật Constructor chỉ còn UserRepository và PasswordEncoder
    public RoleSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        // Kiểm tra xem User Admin (số điện thoại 0123456789) đã tồn tại chưa
        // Nếu chưa tồn tại thì mới tạo
        if (!userRepository.existsByPhone("0123456789")) {

            LocalDate localDate = LocalDate.of(2004, 7, 17);
            Date birthday = Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());

            User adminUser = new User();
            adminUser.setPhone("0123456789");
            adminUser.setPassword(passwordEncoder.encode("123456")); // Mã hóa pass
            adminUser.setFullName("ADMIN");
            adminUser.setEmail("a@gmail.com");
            adminUser.setBirthday(birthday);
            adminUser.setStatus(true);

            // --- THAY ĐỔI QUAN TRỌNG ---
            // Set trực tiếp Enum RoleCode.ADMIN
            adminUser.setRole(RoleCode.ADMIN);

            userRepository.save(adminUser);
            System.out.println(">>> Đã khởi tạo tài khoản ADMIN mặc định (SĐT: 0123456789, Pass: 123456)");
        }
    }
}