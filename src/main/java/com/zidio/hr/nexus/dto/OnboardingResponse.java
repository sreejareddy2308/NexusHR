package com.zidio.hr.nexus.dto;

import java.time.LocalDateTime;

public class OnboardingResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private String email;
    private String department;
    private String jobTitle;
    private String status;
    private LocalDateTime createdAt;
    private String message;

    public OnboardingResponse() {
    }

    public OnboardingResponse(
            Long id,
            Long employeeId,
            String employeeName,
            String email,
            String department,
            String jobTitle,
            String status,
            LocalDateTime createdAt,
            String message) {

        this.id = id;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.email = email;
        this.department = department;
        this.jobTitle = jobTitle;
        this.status = status;
        this.createdAt = createdAt;
        this.message = message;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

