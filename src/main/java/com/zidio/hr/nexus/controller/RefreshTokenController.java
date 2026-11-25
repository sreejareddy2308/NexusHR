package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.dto.RefreshTokenRequest;
import com.zidio.hr.nexus.dto.RefreshTokenResponse;
import com.zidio.hr.nexus.entity.RefreshToken;
import com.zidio.hr.nexus.service.RefreshTokenService;
import com.zidio.hr.nexus.utility.JwtService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class RefreshTokenController {

    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    public RefreshTokenController(
            RefreshTokenService refreshTokenService,
            JwtService jwtService) {

        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<RefreshTokenResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {

        RefreshToken oldToken =
                refreshTokenService.verifyExpiration(
                        request.getRefreshToken()
                );

        var user = oldToken.getUser();

        // Revoke old refresh token
        refreshTokenService.revokeToken(oldToken.getToken());

        // Generate new refresh token
        RefreshToken newToken =
                refreshTokenService.createRefreshToken(user);

        // Generate new access token
        String accessToken =
                jwtService.generateToken(user.getEmail());

        RefreshTokenResponse response =
                new RefreshTokenResponse(
                        accessToken,
                        newToken.getToken(),
                        "Bearer"
                );

        return ResponseEntity.ok(response);
    }
}

