package com.zidio.hr.nexus.dto;

import java.util.List;

public record AttritionRiskResponse(

        long totalEmployeesAssessed,

        long highRiskEmployees,

        long mediumRiskEmployees,

        long lowRiskEmployees,

        long insufficientDataEmployees,

        List<EmployeeRisk> employeeRisks,

        List<String> recommendations,

        String predictionStatus

) {

    public record EmployeeRisk(

            Long employeeId,

            String employeeName,

            String department,

            String riskLevel,

            String reason,

            String recommendedAction

    ) {
    }
}

