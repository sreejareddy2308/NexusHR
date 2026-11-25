package com.zidio.hr.nexus.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
@Setter
@Getter
public class RegisterRequest {
    @NotBlank
    @Size(max = 100)
    private String name;
    @NotBlank
    @Email
    @Size(max = 254)
    private String email;
    @NotBlank
    @Size(min = 8, max = 72)
    private String password;
    @NotBlank
    private String confirm;
    @Pattern(regexp = "EMPLOYEE|HR_MANAGER|ADMIN",
            message = "Role must be EMPLOYEE, HR_MANAGER or ADMIN")
    private String role = "EMPLOYEE";
}

