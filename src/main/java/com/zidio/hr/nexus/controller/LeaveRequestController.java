package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.entity.LeaveRequest;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.service.LeaveRequestService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = "http://localhost:5173")
public class LeaveRequestController {

    private final LeaveRequestService service;
    private final EmployeeRepository employeeRepository;

    public LeaveRequestController(
            LeaveRequestService service,
            EmployeeRepository employeeRepository) {

        this.service = service;
        this.employeeRepository = employeeRepository;
    }

    private Long getAuthenticatedEmployeeId(
            Authentication authentication) {

        Employee employee = employeeRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Employee profile not found"
                        )
                );

        return employee.getId();
    }

    // Employee applies for leave
    @PreAuthorize("hasRole('EMPLOYEE')")
    @PostMapping("/apply")
    public ResponseEntity<LeaveRequest> applyLeave(
            @RequestBody LeaveRequest request,
            Authentication authentication) {

        request.setEmployeeId(
                getAuthenticatedEmployeeId(authentication)
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.applyLeave(request));
    }

    // Employee views own leaves
    @PreAuthorize("hasRole('EMPLOYEE')")
    @GetMapping("/me")
    public ResponseEntity<List<LeaveRequest>> getMyLeaves(
            Authentication authentication) {

        Long employeeId = getAuthenticatedEmployeeId(authentication);

        return ResponseEntity.ok(
                service.getEmployeeLeaves(employeeId)
        );
    }

    // HR and Admin view all leaves
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping
    public ResponseEntity<List<LeaveRequest>> getAllLeaves() {

        return ResponseEntity.ok(service.getAllLeaves());
    }

    // HR and Admin view employee leaves
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveRequest>> getEmployeeLeaves(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                service.getEmployeeLeaves(employeeId)
        );
    }

    // HR and Admin approve or reject
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<LeaveRequest> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return ResponseEntity.ok(
                service.updateLeaveStatus(id, status)
        );
    }

    // HR and Admin delete leave
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLeave(
            @PathVariable Long id) {

        service.deleteLeave(id);

        return ResponseEntity.noContent().build();
    }
}