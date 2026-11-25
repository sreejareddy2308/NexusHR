package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.entity.Attendance;
import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.service.AttendanceService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "http://localhost:5173")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final EmployeeRepository employeeRepository;

    public AttendanceController(
            AttendanceService attendanceService,
            EmployeeRepository employeeRepository) {

        this.attendanceService = attendanceService;
        this.employeeRepository = employeeRepository;
    }

    // Get authenticated employee ID
    private Long getAuthenticatedEmployeeId(
            Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        Employee employee = employeeRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Employee profile not found"
                ));

        return employee.getId();
    }

    // Employee check-in
    @PreAuthorize("hasRole('EMPLOYEE')")
    @PostMapping("/me/check-in")
    public ResponseEntity<Attendance> checkInMe(
            Authentication authentication) {

        Long employeeId =
                getAuthenticatedEmployeeId(authentication);

        return ResponseEntity.ok(
                attendanceService.checkIn(employeeId)
        );
    }

    // Employee check-out
    @PreAuthorize("hasRole('EMPLOYEE')")
    @PutMapping("/me/check-out")
    public ResponseEntity<Attendance> checkOutMe(
            Authentication authentication) {

        Long employeeId =
                getAuthenticatedEmployeeId(authentication);

        return ResponseEntity.ok(
                attendanceService.checkOut(employeeId)
        );
    }

    // Employee views own attendance
    @PreAuthorize("hasRole('EMPLOYEE')")
    @GetMapping("/me")
    public ResponseEntity<List<Attendance>> getMyAttendance(
            Authentication authentication) {

        Long employeeId =
                getAuthenticatedEmployeeId(authentication);

        return ResponseEntity.ok(
                attendanceService.getEmployeeAttendance(employeeId)
        );
    }

    // HR/Admin check-in
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @PostMapping("/check-in/{employeeId}")
    public ResponseEntity<Attendance> checkIn(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                attendanceService.checkIn(employeeId)
        );
    }

    // HR/Admin check-out
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @PutMapping("/check-out/{employeeId}")
    public ResponseEntity<Attendance> checkOut(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                attendanceService.checkOut(employeeId)
        );
    }

    // HR/Admin views all attendance
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping
    public ResponseEntity<List<Attendance>> getAll() {

        return ResponseEntity.ok(
                attendanceService.getAllAttendance()
        );
    }

    // HR/Admin views attendance by employee
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Attendance>> getByEmployee(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                attendanceService.getEmployeeAttendance(employeeId)
        );
    }

    // HR/Admin filters attendance by date
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping("/date/{date}")
    public ResponseEntity<List<Attendance>> getByDate(
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        return ResponseEntity.ok(
                attendanceService.getAttendanceByDate(date)
        );
    }
}

