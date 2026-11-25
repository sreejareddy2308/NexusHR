package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.dto.AttritionRiskResponse;
import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.repository.EmployeeRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class AttritionRiskService {

    private final EmployeeRepository employeeRepository;

    public AttritionRiskService(
            EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public AttritionRiskResponse analyzeAttritionRisk() {

        List<Employee> employees = employeeRepository.findAll();

        LocalDate today = LocalDate.now();

        List<AttritionRiskResponse.EmployeeRisk> risks =
                new ArrayList<>();

        long high = 0;
        long medium = 0;
        long low = 0;
        long insufficient = 0;

        for (Employee employee : employees) {

            if (!employee.isActive()) {
                continue;
            }

            LocalDate joiningDate = employee.getJoiningDate();

            String riskLevel;
            String reason;
            String action;

            if (joiningDate == null ||
                    joiningDate.isAfter(today)) {

                riskLevel = "INSUFFICIENT_DATA";
                reason = "Valid joining date is unavailable.";
                action = "Verify employee joining-date information.";
                insufficient++;

            } else {

                long tenureYears = ChronoUnit.YEARS.between(
                        joiningDate, today
                );

                if (tenureYears < 1) {

                    riskLevel = "HIGH";
                    reason = "Employee has less than one year of tenure.";
                    action = "Review onboarding, mentoring and employee engagement.";
                    high++;

                } else if (tenureYears < 3) {

                    riskLevel = "MEDIUM";
                    reason = "Employee has between one and three years of tenure.";
                    action = "Review career development and growth opportunities.";
                    medium++;

                } else {

                    riskLevel = "LOW";
                    reason = "Employee has three or more years of tenure.";
                    action = "Continue regular engagement and retention monitoring.";
                    low++;
                }
            }

            risks.add(
                    new AttritionRiskResponse.EmployeeRisk(
                            employee.getId(),
                            employee.getEmployeeName(),
                            employee.getDepartment(),
                            riskLevel,
                            reason,
                            action
                    )
            );
        }

        List<String> recommendations = new ArrayList<>();

        if (high > 0) {
            recommendations.add(
                    "Review onboarding and retention support for "
                            + high + " employee(s)."
            );
        }

        if (medium > 0) {
            recommendations.add(
                    "Review career development opportunities for "
                            + medium + " employee(s)."
            );
        }

        if (insufficient > 0) {
            recommendations.add(
                    "Verify joining dates for "
                            + insufficient + " employee(s)."
            );
        }

        if (recommendations.isEmpty()) {
            recommendations.add(
                    "Continue regular employee engagement monitoring."
            );
        }

        return new AttritionRiskResponse(
                risks.size(),
                high,
                medium,
                low,
                insufficient,
                risks,
                recommendations,
                "Preliminary tenure-based retention risk indicators. "
                        + "Not a validated attrition prediction model."
        );
    }
}

