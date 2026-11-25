package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.PasswordResetToken;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetRepository
        extends JpaRepository<PasswordResetToken, Long> {

    // Find reset token
    Optional<PasswordResetToken> findByToken(String token);

    // Check whether token exists
    boolean existsByToken(String token);

    // Find token by email
    Optional<PasswordResetToken> findByEmail(String email);

    // Delete token after password reset
    void deleteByToken(String token);

    // Delete all reset tokens for an email
    void deleteByEmail(String email);
}

