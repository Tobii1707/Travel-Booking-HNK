package com.java.web_travel.repository;

import com.java.web_travel.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository  extends JpaRepository<User, Long> {

    boolean existsByPhone(String phone);

    Optional<User> findByPhone(String phone);

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);
}
