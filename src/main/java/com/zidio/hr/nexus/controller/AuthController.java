package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.dto.LoginRequest;
import com.zidio.hr.nexus.dto.RegisterRequest;
import com.zidio.hr.nexus.dto.RefreshTokenRequest;

import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.entity.RefreshToken;

import com.zidio.hr.nexus.repository.UserRepository;

import com.zidio.hr.nexus.service.AuthService;
import com.zidio.hr.nexus.service.RefreshTokenService;
import com.zidio.hr.nexus.service.AccountActivationService;
import com.zidio.hr.nexus.service.WelcomeEmailService;

import com.zidio.hr.nexus.utility.JwtService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final AuthService authService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final AccountActivationService accountActivationService;
    private final WelcomeEmailService welcomeEmailService;


    // ==========================================
    // REGISTER
    // ==========================================

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request) {

        try {

            User user = new User();

            user.setEmail(request.getEmail());
            user.setPassword(request.getPassword());

            User savedUser = authService.register(
                    user,
                    request.getConfirm(),
                    request.getRole()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message",
                            "Registration successful. Please activate your account.",
                            "email",
                            savedUser.getEmail()
                    ));

        } catch (IllegalArgumentException | IllegalStateException e) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));

        } catch (Exception e) {

            log.error("Registration failed", e);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            "Registration failed. Please try again later."
                    ));
        }
    }


    // ==========================================
    // ACTIVATE ACCOUNT
    // ==========================================

    @PostMapping("/activate")
    public ResponseEntity<?> activateAccount(
            @RequestParam String token,
            @RequestBody Map<String, String> request) {

        try {

            String newPassword = request.get("newPassword");

            accountActivationService.activateAccount(
                    token,
                    newPassword
            );

            return ResponseEntity.ok(
                    Map.of("message", "Account activated successfully")
            );

        } catch (IllegalArgumentException | IllegalStateException e) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));

        } catch (Exception e) {

            log.error("Account activation failed", e);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            "Account activation failed. Please try again later."
                    ));
        }
    }


    // ==========================================
    // LOGIN
    // ==========================================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {

        try {

            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    request.getEmail(),
                                    request.getPassword()
                            )
                    );

            String email = authentication.getName();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() ->
                            new IllegalArgumentException("User not found")
                    );

            // Send welcome email only once after successful login.
            // Email failure must not interrupt authentication.

            try {

                welcomeEmailService.sendWelcomeEmailOnce(user.getId());

            } catch (Exception e) {

                log.error(
                        "Welcome email could not be sent for user: {}",
                        user.getEmail(),
                        e
                );
            }

            String accessToken = jwtService.generateToken(email);

            RefreshToken refreshToken =
                    refreshTokenService.createRefreshToken(user);

            var roles = user.getRoles()
                    .stream()
                    .map(role -> role.getName().name())
                    .toList();

            return ResponseEntity.ok(
                    Map.of(
                            "token", accessToken,
                            "refreshToken", refreshToken.getToken(),
                            "type", "Bearer",
                            "email", email,
                            "roles", roles
                    )
            );

        } catch (AuthenticationException e) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            "Invalid email or password"
                    ));

        } catch (Exception e) {

            log.error("Login failed", e);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            "Login failed. Please try again later."
                    ));
        }
    }


    // ==========================================
    // REFRESH ACCESS TOKEN
    // WITH REFRESH TOKEN ROTATION
    // ==========================================

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {

        try {

            RefreshToken newRefreshToken =
                    refreshTokenService.rotateRefreshToken(
                            request.getRefreshToken()
                    );

            String newAccessToken =
                    jwtService.generateToken(
                            newRefreshToken.getUser().getEmail()
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "token", newAccessToken,
                            "refreshToken", newRefreshToken.getToken(),
                            "type", "Bearer"
                    )
            );

        } catch (IllegalArgumentException | IllegalStateException e) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            "Invalid or expired refresh token"
                    ));

        } catch (Exception e) {

            log.error("Refresh token processing failed", e);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            "Unable to refresh authentication"
                    ));
        }
    }


    // ==========================================
    // LOGOUT
    // ==========================================

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @Valid @RequestBody RefreshTokenRequest request) {

        try {

            refreshTokenService.revokeToken(
                    request.getRefreshToken()
            );

            return ResponseEntity.ok(
                    Map.of("message", "Logged out successfully")
            );

        } catch (IllegalArgumentException | IllegalStateException e) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            "Invalid or already revoked refresh token"
                    ));

        } catch (Exception e) {

            log.error("Logout failed", e);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            "Logout failed. Please try again later."
                    ));
        }
    }


    // ==========================================
    // RESEND ACCOUNT ACTIVATION
    // ==========================================

    @PostMapping("/resend-activation")
    public ResponseEntity<?> resendActivation(
            @RequestParam String email) {

        try {

            accountActivationService.resendActivationEmail(email);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "If the account requires activation, an activation email will be sent."
                    )
            );

        } catch (IllegalArgumentException | IllegalStateException e) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));

        } catch (Exception e) {

            log.error("Resending activation email failed", e);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            "Unable to process activation request"
                    ));
        }
    }
}

