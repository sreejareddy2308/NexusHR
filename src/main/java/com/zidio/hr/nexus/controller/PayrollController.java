package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.dto.PayrollRequest;
import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.entity.Payroll;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.service.PayrollService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@CrossOrigin(origins = "http://localhost:5173")
public class PayrollController {

    private final PayrollService payrollService;
    private final EmployeeRepository employeeRepository;

    public PayrollController(
            PayrollService payrollService,
            EmployeeRepository employeeRepository) {
        this.payrollService = payrollService;
        this.employeeRepository = employeeRepository;
    }

    // Find the employee associated with the authenticated account
    private Long getAuthenticatedEmployeeId(Authentication authentication) {

        Employee employee = employeeRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Employee profile not found"
                ));

        return employee.getId();
    }

    // HR and Admin generate payroll
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @PostMapping("/generate")
    public ResponseEntity<Payroll> generatePayroll(
            @Valid @RequestBody PayrollRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(payrollService.generatePayroll(request));
    }

    // HR and Admin view all payroll records
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping
    public ResponseEntity<List<Payroll>> getAllPayrolls() {
        return ResponseEntity.ok(payrollService.getAllPayrolls());
    }

    // Employees view only their own payroll records
    @PreAuthorize("hasRole('EMPLOYEE')")
    @GetMapping("/me")
    public ResponseEntity<List<Payroll>> getMyPayrolls(
            Authentication authentication) {

        Long employeeId = getAuthenticatedEmployeeId(authentication);

        return ResponseEntity.ok(
                payrollService.getPayrollByEmployee(employeeId)
        );
    }

    // HR and Admin view payroll by ID
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<Payroll> getPayrollById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                payrollService.getPayrollById(id)
        );
    }

    // HR and Admin view a specific employee's payroll
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Payroll>> getPayrollByEmployee(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                payrollService.getPayrollByEmployee(employeeId)
        );
    }

    // HR and Admin view payroll by month
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping("/month/{month}")
    public ResponseEntity<List<Payroll>> getPayrollByMonth(
            @PathVariable String month) {

        return ResponseEntity.ok(
                payrollService.getPayrollByMonth(month)
        );
    }

    // HR and Admin delete payroll
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayroll(
            @PathVariable Long id) {

        payrollService.deletePayroll(id);

        return ResponseEntity.noContent().build();
    }


    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @PutMapping("/{id}/mark-paid")
    public ResponseEntity<Payroll> markPayrollAsPaid(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                payrollService.markPayrollAsPaid(id)
        );
    }
}

