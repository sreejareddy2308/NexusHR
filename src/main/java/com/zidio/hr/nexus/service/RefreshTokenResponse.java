package com.zidio.hr.nexus.service;

public class RefreshTokenResponse {

    private final String accessToken;
    private final String refreshToken;

    public RefreshTokenResponse(
            String accessToken,
            String refreshToken) {

        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public String getTokenType() {
        return "Bearer";
    }
}

