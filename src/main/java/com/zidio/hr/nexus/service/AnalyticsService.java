package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.repository.LeaveRepository;
import com.zidio.hr.nexus.repository.PayrollRepository;
import com.zidio.hr.nexus.repository.PerformanceReviewRepository;
import com.zidio.hr.nexus.repository.AttendanceRepository;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AnalyticsService {

    private final EmployeeRepository employeeRepository;
    private final LeaveRepository leaveRepository;
    private final PayrollRepository payrollRepository;
    private final PerformanceReviewRepository performanceRepository;
    private final AttendanceRepository attendanceRepository;

    public AnalyticsService(
            EmployeeRepository employeeRepository,
            LeaveRepository leaveRepository,
            PayrollRepository payrollRepository,
            PerformanceReviewRepository performanceRepository,
            AttendanceRepository attendanceRepository) {

        this.employeeRepository = employeeRepository;
        this.leaveRepository = leaveRepository;
        this.payrollRepository = payrollRepository;
        this.performanceRepository = performanceRepository;
        this.attendanceRepository = attendanceRepository;
    }

    // Dashboard overview
    public Map<String, Object> getDashboardAnalytics() {

        Map<String, Object> analytics = new HashMap<>();

        analytics.put(
                "totalEmployees",
                employeeRepository.count()
        );

        analytics.put(
                "totalLeaveRequests",
                leaveRepository.count()
        );

        analytics.put(
                "totalPayrollRecords",
                payrollRepository.count()
        );

        analytics.put(
                "totalPerformanceReviews",
                performanceRepository.count()
        );

        analytics.put(
                "totalAttendanceRecords",
                attendanceRepository.count()
        );

        return analytics;
    }

    // Employee statistics
    public Map<String, Object> getEmployeeAnalytics() {

        Map<String, Object> analytics = new HashMap<>();

        analytics.put(
                "totalEmployees",
                employeeRepository.count()
        );

        return analytics;
    }

    // Leave statistics
    public Map<String, Object> getLeaveAnalytics() {

        Map<String, Object> analytics = new HashMap<>();

        analytics.put(
                "totalLeaves",
                leaveRepository.count()
        );

        analytics.put(
                "pendingLeaves",
                leaveRepository.findByStatus("PENDING").size()
        );

        analytics.put(
                "approvedLeaves",
                leaveRepository.findByStatus("APPROVED").size()
        );

        analytics.put(
                "rejectedLeaves",
                leaveRepository.findByStatus("REJECTED").size()
        );

        return analytics;
    }

    // Payroll statistics
    public Map<String, Object> getPayrollAnalytics() {

        Map<String, Object> analytics = new HashMap<>();

        analytics.put(
                "totalPayrollRecords",
                payrollRepository.count()
        );

        analytics.put(
                "paidPayroll",
                payrollRepository.findByStatus("PAID").size()
        );

        analytics.put(
                "pendingPayroll",
                payrollRepository.findByStatus("PENDING").size()
        );

        return analytics;
    }

    // Performance statistics
    public Map<String, Object> getPerformanceAnalytics() {

        Map<String, Object> analytics = new HashMap<>();

        analytics.put(
                "totalReviews",
                performanceRepository.count()
        );

        analytics.put(
                "pendingReviews",
                performanceRepository.findByStatus("PENDING").size()
        );

        analytics.put(
                "completedReviews",
                performanceRepository.findByStatus("COMPLETED").size()
        );

        return analytics;
    }
}
