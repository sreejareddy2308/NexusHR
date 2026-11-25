
package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.entity.LeaveRequest;
import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.entity.Role;

import com.zidio.hr.nexus.exception.ResourceNotFoundException;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.repository.LeaveRepository;
import com.zidio.hr.nexus.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class LeaveRequestService {

    private static final Logger log =
            LoggerFactory.getLogger(LeaveRequestService.class);

    private final LeaveRepository repository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public LeaveRequestService(
            LeaveRepository repository,
            EmployeeRepository employeeRepository,
            UserRepository userRepository,
            NotificationService notificationService) {

        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ==========================================
    // EMPLOYEE APPLIES FOR LEAVE
    // ==========================================

    public LeaveRequest applyLeave(LeaveRequest request) {

        if (request.getEmployeeId() == null) {
            throw new IllegalArgumentException(
                    "Employee ID is required"
            );
        }

        if (request.getLeaveType() == null ||
                request.getLeaveType().isBlank()) {

            throw new IllegalArgumentException(
                    "Leave type is required"
            );
        }

        if (request.getStartDate() == null ||
                request.getEndDate() == null ||
                request.getStartDate().isAfter(request.getEndDate())) {

            throw new IllegalArgumentException(
                    "Invalid leave dates"
            );
        }

        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Leave cannot start in the past"
            );
        }

        Employee employee = employeeRepository
                .findById(request.getEmployeeId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found"
                        )
                );

        request.setStatus("PENDING");

        // Save leave request first
        LeaveRequest savedRequest = repository.save(request);

        // Notify HR and Admin
        notifyHRAboutLeave(savedRequest, employee);

        return savedRequest;
    }

    // ==========================================
    // NOTIFY HR AND ADMIN
    // ==========================================

    private void notifyHRAboutLeave(
            LeaveRequest request,
            Employee employee) {

        try {

            List<User> users = userRepository.findAll();

            Set<String> recipientEmails = users.stream()
                    .filter(user -> user.getRoles() != null)
                    .filter(user -> user.getRoles().stream()
                            .map(Role::getName)
                            .anyMatch(role ->
                                    role != null &&
                                            (role.name().equals("ADMIN") ||
                                                    role.name().equals("HR_MANAGER"))
                            )
                    )
                    .map(User::getEmail)
                    .filter(email -> email != null && !email.isBlank())
                    .collect(Collectors.toSet());

            for (String email : recipientEmails) {

                notificationService.createNotification(
                        email,
                        "New Leave Request",
                        employee.getEmployeeName()
                                + " has submitted a "
                                + request.getLeaveType()
                                + " leave request from "
                                + request.getStartDate()
                                + " to "
                                + request.getEndDate()
                                + ".",
                        "LEAVE_REQUEST"
                );
            }

        } catch (Exception exception) {

            log.error(
                    "Leave request saved, but HR notification failed",
                    exception
            );
        }
    }

    // ==========================================
    // GET ALL LEAVE REQUESTS
    // ==========================================

    public List<LeaveRequest> getAllLeaves() {

        return repository.findAllByOrderByCreatedAtDesc();
    }

    // ==========================================
    // GET EMPLOYEE LEAVE REQUESTS
    // ==========================================

    public List<LeaveRequest> getEmployeeLeaves(Long employeeId) {

        if (employeeId == null) {
            throw new IllegalArgumentException(
                    "Employee ID is required"
            );
        }

        return repository.findByEmployeeId(employeeId);
    }

    // ==========================================
    // GET EMPLOYEE LEAVES BY STATUS
    // ==========================================

    public List<LeaveRequest> getEmployeeLeavesByStatus(
            Long employeeId,
            String status) {

        return repository.findByEmployeeIdAndStatus(
                employeeId,
                normalizeStatus(status)
        );
    }

    // ==========================================
    // GET LEAVES BY STATUS
    // ==========================================

    public List<LeaveRequest> getLeavesByStatus(String status) {

        return repository.findByStatus(
                normalizeStatus(status)
        );
    }

    // ==========================================
    // APPROVE OR REJECT LEAVE
    // ==========================================

    public LeaveRequest updateLeaveStatus(
            Long id,
            String status) {

        LeaveRequest request = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Leave request not found: " + id
                        )
                );

        String normalizedStatus = normalizeStatus(status);

        if (!normalizedStatus.equals("APPROVED") &&
                !normalizedStatus.equals("REJECTED")) {

            throw new IllegalArgumentException(
                    "Status must be APPROVED or REJECTED"
            );
        }

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {

            throw new IllegalStateException(
                    "Only pending leave requests can be updated"
            );
        }

        Employee employee = employeeRepository
                .findById(request.getEmployeeId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found"
                        )
                );

        // Update status
        request.setStatus(normalizedStatus);

        LeaveRequest updatedRequest = repository.save(request);

        // Notify employee
        notifyEmployeeAboutLeave(
                updatedRequest,
                employee
        );

        return updatedRequest;
    }

    // ==========================================
    // NOTIFY EMPLOYEE
    // ==========================================

    private void notifyEmployeeAboutLeave(
            LeaveRequest request,
            Employee employee) {

        try {

            String title;
            String message;
            String type;

            if ("APPROVED".equals(request.getStatus())) {

                title = "Leave Approved";

                message = "Your "
                        + request.getLeaveType()
                        + " leave request from "
                        + request.getStartDate()
                        + " to "
                        + request.getEndDate()
                        + " has been approved.";

                type = "LEAVE_APPROVED";

            } else {

                title = "Leave Rejected";

                message = "Your "
                        + request.getLeaveType()
                        + " leave request from "
                        + request.getStartDate()
                        + " to "
                        + request.getEndDate()
                        + " has been rejected.";

                type = "LEAVE_REJECTED";
            }

            notificationService.createNotification(
                    employee.getEmail(),
                    title,
                    message,
                    type
            );

        } catch (Exception exception) {

            log.error(
                    "Leave status updated, but employee notification failed",
                    exception
            );
        }
    }

    // ==========================================
    // DELETE LEAVE REQUEST
    // ==========================================

    public void deleteLeave(Long id) {

        LeaveRequest request = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Leave request not found: " + id
                        )
                );

        repository.delete(request);
    }

    // ==========================================
    // NORMALIZE STATUS
    // ==========================================

    private String normalizeStatus(String status) {

        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException(
                    "Leave status is required"
            );
        }

        return status.trim().toUpperCase(Locale.ROOT);
    }
}

