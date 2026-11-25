package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.dto.OnboardingRequest;
import com.zidio.hr.nexus.entity.Onboarding;
import com.zidio.hr.nexus.service.OnboardingService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

        import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @PostMapping
    public ResponseEntity<Onboarding> create(
            @Valid @RequestBody OnboardingRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(onboardingService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<Onboarding>> getAll() {
        return ResponseEntity.ok(onboardingService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Onboarding> getById(@PathVariable Long id) {
        return ResponseEntity.ok(onboardingService.getById(id));
    }

    @GetMapping("/status/{employeeId}")
    public ResponseEntity<Onboarding> getByEmployeeId(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                onboardingService.getByEmployeeId(employeeId));
    }

    @GetMapping("/{id}/progress")
    public ResponseEntity<Map<String, Object>> getProgress(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                onboardingService.getProgress(id));
    }

    @PatchMapping("/{id}/tasks/{taskId}")
    public ResponseEntity<Onboarding> updateTask(
            @PathVariable Long id,
            @PathVariable Long taskId,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");

        if (status == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Task status is required");
        }

        return ResponseEntity.ok(
                onboardingService.updateTask(id, taskId, status));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<Onboarding> complete(
            @PathVariable Long id) {

        return ResponseEntity.ok(onboardingService.complete(id));
    }
}
