package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.PasswordResetToken;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByUser_Id(Long userId);

    void deleteByEmail(String normalizedEmail);
}

