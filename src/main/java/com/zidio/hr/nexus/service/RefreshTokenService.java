package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.RefreshToken;
import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.repository.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository tokenRepository;

    @Value("${nexushr.jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    // Create refresh token
    private RefreshToken createNewToken(User user) {

        if (refreshExpiration <= 0) {
            throw new IllegalStateException(
                    "Refresh token expiration must be positive"
            );
        }

        RefreshToken refreshToken = new RefreshToken();

        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());

        refreshToken.setExpiryDate(
                LocalDateTime.now()
                        .plusNanos(refreshExpiration * 1_000_000)
        );

        refreshToken.setRevoked(false);

        return tokenRepository.save(refreshToken);
    }

    // Create refresh token during login
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        return createNewToken(user);
    }

    // Verify refresh token
    @Transactional(readOnly = true)
    public RefreshToken verifyExpiration(String token) {

        RefreshToken refreshToken = findByToken(token);

        if (refreshToken.isRevoked()) {
            throw new IllegalArgumentException(
                    "Refresh token has been revoked"
            );
        }

        if (refreshToken.getExpiryDate() == null ||
                !refreshToken.getExpiryDate().isAfter(LocalDateTime.now())) {

            throw new IllegalArgumentException(
                    "Refresh token has expired"
            );
        }

        return refreshToken;
    }

    // Rotate refresh token: revoke old token and issue new token
    @Transactional
    public RefreshToken rotateRefreshToken(String token) {

        RefreshToken oldToken = verifyExpiration(token);

        User user = oldToken.getUser();

        if (user == null) {
            throw new IllegalArgumentException(
                    "Invalid refresh token"
            );
        }

        oldToken.setRevoked(true);
        tokenRepository.save(oldToken);

        return createNewToken(user);
    }

    // Revoke one refresh token
    @Transactional
    public void revokeToken(String token) {

        RefreshToken refreshToken = findByToken(token);

        if (refreshToken.isRevoked()) {
            throw new IllegalArgumentException(
                    "Refresh token already revoked"
            );
        }

        refreshToken.setRevoked(true);
        tokenRepository.save(refreshToken);
    }

    // Revoke all refresh tokens for a user
    @Transactional
    public void revokeAllTokens(User user) {

        List<RefreshToken> tokens =
                tokenRepository.findAllByUser(user);

        for (RefreshToken refreshToken : tokens) {
            refreshToken.setRevoked(true);
        }

        tokenRepository.saveAll(tokens);
    }

    // Find refresh token by token value
    public RefreshToken findByToken(String token) {

        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException(
                    "Refresh token is required"
            );
        }

        return tokenRepository.findByToken(token.trim())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Refresh token not found"
                        )
                );
    }
}

