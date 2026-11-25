package com.zidio.hr.nexus.utility;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expiration;

    public JwtService(
            @Value("${nexushr.jwt.secret}") String secret,
            @Value("${nexushr.jwt.expiration}") long expiration) {

        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException(
                    "JWT secret must not be empty"
            );
        }

        if (expiration <= 0) {
            throw new IllegalArgumentException(
                    "JWT expiration must be greater than zero"
            );
        }

        this.key = Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(secret.trim())
        );

        this.expiration = expiration;
    }

    // Generate JWT token
    public String generateToken(String email) {

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException(
                    "Email must not be empty"
            );
        }

        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    // Extract email from JWT
    public String extractEmail(String token) {
        return validateToken(token).getSubject();
    }

    // Validate JWT against expected email
    public boolean isTokenValid(String token, String email) {

        try {
            Claims claims = validateToken(token);

            return email != null
                    && email.equals(claims.getSubject());

        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // Validate JWT and return claims
    public Claims validateToken(String token) {

        Claims claims = extractAllClaims(token);

        if (claims.getExpiration() == null
                || !claims.getExpiration().after(new Date())) {

            throw new JwtException(
                    "JWT is missing expiration or has expired"
            );
        }

        return claims;
    }

    // Backward-compatible claims validation method
    public Claims validateTokenAndGetClaims(String token) {
        return validateToken(token);
    }

    // Verify signature and extract claims
    private Claims extractAllClaims(String token) {

        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

