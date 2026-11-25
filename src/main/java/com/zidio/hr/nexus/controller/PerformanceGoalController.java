package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.dto.PerformanceGoalDTO;
import com.zidio.hr.nexus.service.PerformanceGoalService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/performance/goals")
@RequiredArgsConstructor
public class PerformanceGoalController {

    private final PerformanceGoalService goalService;

    // Create performance goal
    @PostMapping
    public ResponseEntity<PerformanceGoalDTO> createGoal(
            @Valid @RequestBody PerformanceGoalDTO dto) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(goalService.createGoal(dto));
    }

    // Get all performance goals
    @GetMapping
    public ResponseEntity<List<PerformanceGoalDTO>> getAllGoals() {

        return ResponseEntity.ok(goalService.getAllGoals());
    }

    // Get goal by ID
    @GetMapping("/{id}")
    public ResponseEntity<PerformanceGoalDTO> getGoalById(
            @PathVariable Long id) {

        return ResponseEntity.ok(goalService.getGoalById(id));
    }

    // Get goals by employee ID
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<PerformanceGoalDTO>> getGoalsByEmployee(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                goalService.getGoalsByEmployee(employeeId));
    }

    // Update performance goal
    @PutMapping("/{id}")
    public ResponseEntity<PerformanceGoalDTO> updateGoal(
            @PathVariable Long id,
            @RequestBody PerformanceGoalDTO dto) {

        return ResponseEntity.ok(
                goalService.updateGoal(id, dto));
    }

    // Delete performance goal
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable Long id) {

        goalService.deleteGoal(id);

        return ResponseEntity.noContent().build();
    }
}

