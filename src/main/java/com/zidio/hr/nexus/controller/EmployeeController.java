
package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.dto.ApiResponse;
import com.zidio.hr.nexus.dto.EmployeeDTO;
import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.service.EmployeeService;

import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private static final Logger logger =
            LoggerFactory.getLogger(EmployeeController.class);

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    // CREATE EMPLOYEE
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeDTO>> createEmployee(
            @Valid @RequestBody EmployeeDTO employeeDTO) {

        logger.info("Received employee DTO: {}", employeeDTO);
        logger.info("Received employee name: [{}]", employeeDTO.getEmployeeName());

        EmployeeDTO savedEmployeeDTO =
                employeeService.createEmployee(employeeDTO);

        ApiResponse<EmployeeDTO> response =
                new ApiResponse<>(
                        true,
                        "Employee created successfully.",
                        savedEmployeeDTO
                );

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // GET EMPLOYEE BY ID
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Employee>> getEmployeeById(
            @PathVariable Long id) {

        Employee employee = employeeService.getEmployeeById(id);

        ApiResponse<Employee> response =
                new ApiResponse<>(
                        true,
                        "Employee details retrieved successfully.",
                        employee
                );

        return ResponseEntity.ok(response);
    }

    // UPDATE EMPLOYEE
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeDTO>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeDTO employeeDTO) {

        EmployeeDTO updatedEmployeeDTO =
                employeeService.updateEmployee(id, employeeDTO);

        ApiResponse<EmployeeDTO> response =
                new ApiResponse<>(
                        true,
                        "Employee updated successfully.",
                        updatedEmployeeDTO
                );

        return ResponseEntity.ok(response);
    }

    // DELETE EMPLOYEE - ADMIN ONLY
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(
            @PathVariable Long id) {

        try {
            employeeService.deleteEmployee(id);

            ApiResponse<Void> response =
                    new ApiResponse<>(
                            true,
                            "Employee deleted successfully.",
                            null
                    );

            return ResponseEntity.ok(response);

        } catch (DataIntegrityViolationException exception) {

            logger.warn(
                    "Employee {} cannot be deleted because related records exist.",
                    id
            );

            ApiResponse<Void> response =
                    new ApiResponse<>(
                            false,
                            "This employee cannot be deleted because related HR records exist. "
                                    + "Preserve the employee record and its associated data.",
                            null
                    );

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(response);
        }
    }

    // PAGINATION AND SORTING
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping("/paginated")
    public ResponseEntity<ApiResponse<Page<EmployeeDTO>>> getEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "employeeName") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<EmployeeDTO> employeeDtoPage =
                employeeService.getEmployees(pageable);

        ApiResponse<Page<EmployeeDTO>> response =
                new ApiResponse<>(
                        true,
                        "Paginated employees retrieved successfully.",
                        employeeDtoPage
                );

        return ResponseEntity.ok(response);
    }

    // GET ALL EMPLOYEES
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> getAllEmployees() {

        List<EmployeeDTO> employees =
                employeeService.getAllEmployees();

        ApiResponse<List<EmployeeDTO>> response =
                new ApiResponse<>(
                        true,
                        "All employees retrieved successfully.",
                        employees
                );

        return ResponseEntity.ok(response);
    }

    // SEARCH EMPLOYEE BY NAME
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> searchByName(
            @RequestParam String name) {

        List<EmployeeDTO> matchedEmployees =
                employeeService.searchByName(name);

        ApiResponse<List<EmployeeDTO>> response =
                new ApiResponse<>(
                        true,
                        "Employees matching search criteria retrieved successfully.",
                        matchedEmployees
                );

        return ResponseEntity.ok(response);
    }

    // FILTER BY DEPARTMENT
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping("/filter/department")
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> filterByDepartment(
            @RequestParam String department) {

        List<EmployeeDTO> matchedEmployees =
                employeeService.filterByDepartment(department);

        ApiResponse<List<EmployeeDTO>> response =
                new ApiResponse<>(
                        true,
                        "Employees filtered by department retrieved successfully.",
                        matchedEmployees
                );

        return ResponseEntity.ok(response);
    }

    // SEARCH BY JOB TITLE
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    @GetMapping("/search/job-title")
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> searchByJobTitle(
            @RequestParam String jobTitle) {

        List<EmployeeDTO> matchedEmployees =
                employeeService.searchByJobTitle(jobTitle);

        ApiResponse<List<EmployeeDTO>> response =
                new ApiResponse<>(
                        true,
                        "Employees matching job title retrieved successfully.",
                        matchedEmployees
                );

        return ResponseEntity.ok(response);
    }

    // GET LOGGED-IN EMPLOYEE PROFILE
    @PreAuthorize("hasRole('EMPLOYEE')")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<EmployeeDTO>> getMyProfile(
            Authentication authentication) {

        EmployeeDTO profile =
                employeeService.getMyProfile(authentication.getName());

        ApiResponse<EmployeeDTO> response =
                new ApiResponse<>(
                        true,
                        "Employee profile retrieved successfully.",
                        profile
                );

        return ResponseEntity.ok(response);
    }

    // UPDATE LOGGED-IN EMPLOYEE PROFILE
    @PreAuthorize("hasRole('EMPLOYEE')")
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<EmployeeDTO>> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody EmployeeDTO employeeDTO) {

        EmployeeDTO updatedProfile =
                employeeService.updateMyProfile(
                        authentication.getName(),
                        employeeDTO
                );

        ApiResponse<EmployeeDTO> response =
                new ApiResponse<>(
                        true,
                        "Employee profile updated successfully.",
                        updatedProfile
                );

        return ResponseEntity.ok(response);
    }

    // GET INACTIVE EMPLOYEES - ADMIN ONLY
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/inactive")
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> getInactiveEmployees() {

        List<EmployeeDTO> employees =
                employeeService.getInactiveEmployees();

        ApiResponse<List<EmployeeDTO>> response =
                new ApiResponse<>(
                        true,
                        "Inactive employees retrieved successfully.",
                        employees
                );

        return ResponseEntity.ok(response);
    }

    // DEACTIVATE EMPLOYEE - ADMIN ONLY
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<EmployeeDTO>> deactivateEmployee(
            @PathVariable Long id) {

        EmployeeDTO employee =
                employeeService.deactivateEmployee(id);

        ApiResponse<EmployeeDTO> response =
                new ApiResponse<>(
                        true,
                        "Employee deactivated successfully. Historical HR records are preserved.",
                        employee
                );

        return ResponseEntity.ok(response);
    }

    // REACTIVATE EMPLOYEE - ADMIN ONLY
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<ApiResponse<EmployeeDTO>> reactivateEmployee(
            @PathVariable Long id) {

        EmployeeDTO employee =
                employeeService.reactivateEmployee(id);

        ApiResponse<EmployeeDTO> response =
                new ApiResponse<>(
                        true,
                        "Employee reactivated successfully.",
                        employee
                );

        return ResponseEntity.ok(response);
    }


}

