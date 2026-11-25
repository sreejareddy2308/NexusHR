package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.dto.ActivateAccountRequest;
import com.zidio.hr.nexus.service.AccountActivationService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

        import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class AccountActivationController {

    private final AccountActivationService activationService;

    @PostMapping("/activate-account")
    public ResponseEntity<?> activateAccount(
            @Valid @RequestBody ActivateAccountRequest request) {

        try {

            activationService.activateAccount(
                    request.getToken(),
                    request.getNewPassword()
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Account activated successfully. You can now log in."
                    )
            );

        } catch (IllegalArgumentException |
                 IllegalStateException e) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage())
            );
        }
    }
}

