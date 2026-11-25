package com.zidio.hr.nexus.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
@Setter
@Getter
public class RefreshTokenResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;

    public RefreshTokenResponse(
            String accessToken,
            String refreshToken,
            String tokenType) {

        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
    }

}
