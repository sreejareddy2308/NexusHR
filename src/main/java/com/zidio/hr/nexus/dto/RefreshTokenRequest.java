package com.zidio.hr.nexus.dto;

//package com.zidio.hr.nexus.dto.RefreshTokenRequest;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;

    public RefreshTokenRequest() {

    }

    public RefreshTokenRequest(String refreshToken) {
        this.refreshToken = refreshToken;
    }

}
