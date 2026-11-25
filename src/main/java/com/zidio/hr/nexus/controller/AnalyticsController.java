package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:5173")
public class AnalyticsController {

    private final EmployeeRepository employeeRepository;

    public AnalyticsController(
            EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    // 1. Complete dashboard analytics
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {

        List<Employee> employees = employeeRepository.findAll();

        long totalEmployees = employees.size();

        double averageSalary = employees.stream()
                .filter(e -> e.getSalary() != null)
                .mapToDouble(Employee::getSalary)
                .average()
                .orElse(0.0);

        double totalSalary = employees.stream()
                .filter(e -> e.getSalary() != null)
                .mapToDouble(Employee::getSalary)
                .sum();

        Map<String, Long> departmentCounts = employees.stream()
                .filter(e -> e.getDepartment() != null
                        && !e.getDepartment().isBlank())
                .collect(Collectors.groupingBy(
                        Employee::getDepartment,
                        LinkedHashMap::new,
                        Collectors.counting()));

        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("totalEmployees", totalEmployees);
        analytics.put("averageSalary", averageSalary);
        analytics.put("totalSalary", totalSalary);
        analytics.put("departmentCounts", departmentCounts);

        return ResponseEntity.ok(analytics);
    }

    // 2. Total employee count
    @GetMapping("/employee-count")
    public ResponseEntity<Long> getEmployeeCount() {
        return ResponseEntity.ok(employeeRepository.count());
    }

    // 3. Department-wise employee count
    @GetMapping("/departments")
    public ResponseEntity<Map<String, Long>>
    getDepartmentAnalytics() {

        Map<String, Long> result = employeeRepository.findAll()
                .stream()
                .filter(e -> e.getDepartment() != null
                        && !e.getDepartment().isBlank())
                .collect(Collectors.groupingBy(
                        Employee::getDepartment,
                        LinkedHashMap::new,
                        Collectors.counting()));

        return ResponseEntity.ok(result);
    }

    // 4. Average employee salary
    @GetMapping("/average-salary")
    public ResponseEntity<Double> getAverageSalary() {

        double average = employeeRepository.findAll()
                .stream()
                .filter(e -> e.getSalary() != null)
                .mapToDouble(Employee::getSalary)
                .average()
                .orElse(0.0);

        return ResponseEntity.ok(average);
    }
}
