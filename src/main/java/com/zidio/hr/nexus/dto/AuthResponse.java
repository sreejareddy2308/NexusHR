package com.zidio.hr.nexus.dto;


import lombok.Data;

@Data
public class AuthResponse {
    private final String token;
    private final String type = "Bearer";

}

