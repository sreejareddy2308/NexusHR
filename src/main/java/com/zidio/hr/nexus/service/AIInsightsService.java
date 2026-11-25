package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.dto.AIInsightsResponse;
import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.repository.EmployeeRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AIInsightsService {

    private final EmployeeRepository employeeRepository;

    public AIInsightsService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public AIInsightsResponse getWorkforceInsights() {

        // Fetch existing employee records
        List<Employee> employees = employeeRepository.findAll();

        long totalEmployees = employees.size();

        // Active and inactive employee statistics
        List<Employee> activeList = employees.stream()
                .filter(Employee::isActive)
                .toList();

        long activeEmployees = activeList.size();

        long inactiveEmployees = totalEmployees - activeEmployees;

        // Department analytics
        Map<String, Long> departmentAnalytics =
                groupEmployees(activeList, Employee::getDepartment);

        // Job title analytics
        Map<String, Long> jobTitleAnalytics =
                groupEmployees(activeList, Employee::getJobTitle);

        // Current date
        LocalDate today = LocalDate.now();

        // Calculate valid employee tenure
        List<Long> tenureDays = activeList.stream()
                .map(Employee::getJoiningDate)
                .filter(date -> date != null && !date.isAfter(today))
                .map(date -> ChronoUnit.DAYS.between(date, today))
                .toList();

        double averageTenureYears = tenureDays.stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(0.0) / 365.2425;

        averageTenureYears =
                Math.round(averageTenureYears * 100.0) / 100.0;

        // Employee tenure distribution
        Map<String, Long> employeesByTenure =
                groupEmployeesByTenure(activeList, today);

        // Workforce recommendations
        List<String> recommendations = new ArrayList<>();

        if (totalEmployees == 0) {

            recommendations.add(
                    "Add employee records to begin workforce analytics."
            );

        } else if (activeEmployees == 0) {

            recommendations.add(
                    "No active employees found. Review employee employment statuses."
            );

        } else {

            // Inactive employee recommendation
            if (inactiveEmployees > 0) {
                recommendations.add(
                        inactiveEmployees +
                                " inactive employee record(s) found. " +
                                "Review their employment status."
                );
            }

            // Missing department information
            long missingDepartments = activeList.stream()
                    .filter(e -> isMissing(e.getDepartment()))
                    .count();

            if (missingDepartments > 0) {
                recommendations.add(
                        missingDepartments +
                                " active employee(s) have no department assigned."
                );
            }

            // Missing job title information
            long missingJobTitles = activeList.stream()
                    .filter(e -> isMissing(e.getJobTitle()))
                    .count();

            if (missingJobTitles > 0) {
                recommendations.add(
                        missingJobTitles +
                                " active employee(s) have no job title assigned."
                );
            }

            // Missing joining dates
            long missingJoiningDates = activeList.stream()
                    .filter(e -> e.getJoiningDate() == null)
                    .count();

            if (missingJoiningDates > 0) {
                recommendations.add(
                        missingJoiningDates +
                                " active employee(s) have no joining date assigned."
                );
            }

            // Future joining dates
            long futureJoiningDates = activeList.stream()
                    .map(Employee::getJoiningDate)
                    .filter(date -> date != null && date.isAfter(today))
                    .count();

            if (futureJoiningDates > 0) {
                recommendations.add(
                        futureJoiningDates +
                                " active employee(s) have a future joining date. " +
                                "Verify these records."
                );
            }

            // Department concentration analysis
            if (activeEmployees >= 5 &&
                    !departmentAnalytics.isEmpty()) {

                Map.Entry<String, Long> largestDepartment =
                        departmentAnalytics.entrySet()
                                .stream()
                                .max(Map.Entry.comparingByValue())
                                .orElse(null);

                if (largestDepartment != null &&
                        !"Unassigned".equalsIgnoreCase(
                                largestDepartment.getKey())) {

                    long departmentCount = largestDepartment.getValue();

                    double departmentPercentage =
                            (departmentCount * 100.0) / activeEmployees;

                    if (departmentPercentage >= 80.0) {

                        recommendations.add(
                                Math.round(departmentPercentage) +
                                        "% of active employees are assigned to the " +
                                        largestDepartment.getKey() +
                                        " department. Verify that this distribution " +
                                        "accurately reflects workforce allocation."
                        );
                    }
                }
            }

            // Data readiness recommendation
            long unknownTenure = employeesByTenure.getOrDefault(
                    "Unknown", 0L
            );

            if (unknownTenure > 0) {
                recommendations.add(
                        unknownTenure +
                                " active employee(s) have unknown tenure. " +
                                "Complete their joining-date information."
                );
            }

            // Default recommendation
            if (recommendations.isEmpty()) {
                recommendations.add(
                        "No immediate workforce data-quality issues detected. " +
                                "Continue monitoring workforce trends."
                );
            }
        }

        // Return complete workforce insights
        return new AIInsightsResponse(
                totalEmployees,
                activeEmployees,
                inactiveEmployees,
                departmentAnalytics,
                jobTitleAnalytics,
                recommendations,
                "Predictive AI model not connected yet.",
                averageTenureYears,
                employeesByTenure
        );
    }

    // Case-insensitive department and job-title grouping
    private Map<String, Long> groupEmployees(
            List<Employee> employees,
            Function<Employee, String> classifier
    ) {

        return employees.stream()
                .collect(Collectors.groupingBy(
                        employee -> {
                            String value = classifier.apply(employee);

                            return isMissing(value)
                                    ? "Unassigned"
                                    : value.trim();
                        },
                        () -> new TreeMap<>(
                                String.CASE_INSENSITIVE_ORDER
                        ),
                        Collectors.counting()
                ));
    }

    // Employee tenure grouping
    private Map<String, Long> groupEmployeesByTenure(
            List<Employee> employees,
            LocalDate today
    ) {

        return employees.stream()
                .collect(Collectors.groupingBy(
                        employee -> {

                            LocalDate joiningDate =
                                    employee.getJoiningDate();

                            if (joiningDate == null ||
                                    joiningDate.isAfter(today)) {
                                return "Unknown";
                            }

                            long years = ChronoUnit.YEARS.between(
                                    joiningDate,
                                    today
                            );

                            if (years < 1) {
                                return "Less than 1 year";
                            } else if (years < 3) {
                                return "1-3 years";
                            } else if (years < 5) {
                                return "3-5 years";
                            } else {
                                return "5+ years";
                            }
                        },
                        TreeMap::new,
                        Collectors.counting()
                ));
    }

    // Validate missing data
    private boolean isMissing(String value) {
        return value == null || value.isBlank();
    }
}

