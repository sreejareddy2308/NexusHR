package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.entity.PerformanceReview;
import com.zidio.hr.nexus.service.PerformanceReviewService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/performance-reviews")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
public class PerformanceReviewController {

    private final PerformanceReviewService service;

    // Create performance review
    @PostMapping
    public ResponseEntity<PerformanceReview> createReview(
            @Valid @RequestBody PerformanceReview review) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createReview(review));
    }

    // Get all reviews
    @GetMapping
    public ResponseEntity<List<PerformanceReview>> getAllReviews() {

        return ResponseEntity.ok(service.getAllReviews());
    }

    // Get review by ID
    @GetMapping("/{id}")
    public ResponseEntity<PerformanceReview> getReviewById(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.getReviewById(id));
    }

    // Get reviews by employee
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<PerformanceReview>> getReviewsByEmployee(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                service.getReviewsByEmployee(employeeId));
    }

    // Update review
    @PutMapping("/{id}")
    public ResponseEntity<PerformanceReview> updateReview(
            @PathVariable Long id,
            @Valid @RequestBody PerformanceReview review) {

        return ResponseEntity.ok(
                service.updateReview(id, review));
    }

    // Update review status
    @PutMapping("/{id}/status")
    public ResponseEntity<PerformanceReview> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return ResponseEntity.ok(
                service.updateStatus(id, status));
    }

    // Delete review
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long id) {

        service.deleteReview(id);

        return ResponseEntity.noContent().build();
    }
}

