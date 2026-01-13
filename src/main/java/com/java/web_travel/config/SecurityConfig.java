package com.java.web_travel.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Bean PasswordEncoder: Dùng để mã hóa mật khẩu và kiểm tra mật khẩu.
     * Bean này sẽ được tiêm (Inject) vào UserServiceImpl.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * SecurityFilterChain: Cấu hình quyền truy cập (Ai được vào đâu).
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Tắt CSRF (Cross-Site Request Forgery) vì thường không cần thiết cho REST API stateless
                .csrf(AbstractHttpConfigurer::disable)

                // 2. Cấu hình quyền truy cập cho các đường dẫn
                .authorizeHttpRequests(auth -> auth
                        // QUAN TRỌNG: Mở quyền cho các API Đăng nhập, Đăng ký, API công khai
                        // Bạn cần thay đổi các đường dẫn bên dưới cho khớp với Controller của bạn
                        .requestMatchers(
                                "/api/users/register", // Ví dụ: Đường dẫn tạo user
                                "/api/users/login",    // Ví dụ: Đường dẫn đăng nhập
                                "/api/public/**",      // Các API công khai khác
                                "/swagger-ui/**",      // Nếu dùng Swagger
                                "/v3/api-docs/**"      // Tài liệu API
                        ).permitAll()

                        // Các đường dẫn còn lại bắt buộc phải đăng nhập mới được truy cập
                        // (Nếu bạn muốn test nhanh mà chưa làm chức năng login lấy token, hãy đổi .authenticated() thành .permitAll())
                        .anyRequest().permitAll()
                );

        return http.build();
    }
}