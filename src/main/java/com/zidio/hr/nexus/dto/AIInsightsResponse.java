package com.zidio.hr.nexus.dto;

import java.util.List;
import java.util.Map;

public record AIInsightsResponse(

        long totalEmployees,

        long activeEmployees,

        long inactiveEmployees,

        Map<String, Long> employeesByDepartment,

        Map<String, Long> employeesByJobTitle,

        List<String> recommendations,

        String predictionStatus,

        double averageTenureYears,

        Map<String, Long> employeesByTenure

) {
}

