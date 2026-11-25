package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.entity.PasswordResetToken;
import com.zidio.hr.nexus.repository.PasswordResetTokenRepository;
import com.zidio.hr.nexus.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;

@Service
public class PasswordResetTokenService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetTokenService(
            PasswordResetTokenRepository tokenRepository,
            UserRepository userRepository) {

        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
    }

    // Create reset token
    @Transactional
    public String createResetToken(String email) {

        String normalizedEmail = email.trim()
                .toLowerCase(Locale.ROOT);

        User user = userRepository
                .findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Delete previous reset tokens
        tokenRepository.deleteByEmail(normalizedEmail);

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String token = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        PasswordResetToken resetToken =
                new PasswordResetToken(
                        token,
                        normalizedEmail,
                        LocalDateTime.now().plusMinutes(15)
                );

        tokenRepository.save(resetToken);

        return token;
    }

    // Validate reset token
    @Transactional(readOnly = true)
    public User validateResetToken(String token) {

        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException(
                    "Reset token is required");
        }

        PasswordResetToken resetToken =
                tokenRepository.findByToken(token)
                        .orElseThrow(() ->
                                new RuntimeException("Invalid token"));

        if (resetToken.isUsed()) {
            throw new RuntimeException("Token already used");
        }

        if (!resetToken.getExpiryDate()
                .isAfter(LocalDateTime.now())) {

            throw new RuntimeException("Token expired");
        }

        return userRepository
                .findByEmail(resetToken.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }

    // Mark token as used
    @Transactional
    public void markTokenAsUsed(String token) {

        PasswordResetToken resetToken =
                tokenRepository.findByToken(token)
                        .orElseThrow(() ->
                                new RuntimeException("Invalid token"));

        if (resetToken.isUsed()) {
            throw new RuntimeException("Token already used");
        }

        if (!resetToken.getExpiryDate()
                .isAfter(LocalDateTime.now())) {

            throw new RuntimeException("Token expired");
        }

        resetToken.setUsed(true);

        tokenRepository.save(resetToken);
    }
}

