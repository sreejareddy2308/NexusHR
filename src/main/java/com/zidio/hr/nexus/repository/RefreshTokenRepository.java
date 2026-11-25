package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.RefreshToken;
import com.zidio.hr.nexus.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, Long> {

    // Find refresh token by token value
    Optional<RefreshToken> findByToken(String token);

    // Find all refresh tokens belonging to a user
    List<RefreshToken> findAllByUser(User user);


}

