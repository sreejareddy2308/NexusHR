
package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.dto.ForgotPasswordRequest;
import com.zidio.hr.nexus.dto.ResetPasswordRequest;
import com.zidio.hr.nexus.service.PasswordResetService;

import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class PasswordResetController {

    private static final Logger logger =
            LoggerFactory.getLogger(PasswordResetController.class);

    private final PasswordResetService passwordResetService;

    public PasswordResetController(
            PasswordResetService passwordResetService) {

        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        try {
            passwordResetService.forgotPassword(request.getEmail());

        } catch (RuntimeException e) {
            // Keep the response identical to prevent email enumeration.
            logger.error("Password reset request processing failed", e);
        }

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "If the account exists, a password reset email will be sent."
                )
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        try {
            passwordResetService.resetPassword(
                    request.getToken(),
                    request.getNewPassword()
            );

            return ResponseEntity.ok(
                    Map.of("message", "Password reset successful")
            );

        } catch (IllegalArgumentException |
                 IllegalStateException e) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage())
            );

        } catch (Exception e) {

            logger.error("Unexpected password reset failure", e);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of(
                            "message",
                            "Unable to reset password due to a server error."
                    )
            );
        }
    }
}

