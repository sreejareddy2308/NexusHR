package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.entity.LeaveRequest;
import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.enums.UserRole;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.repository.LeaveRepository;
import com.zidio.hr.nexus.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class LeaveService {

    private final LeaveRepository leaveRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public LeaveService(
            LeaveRepository leaveRepository,
            EmployeeRepository employeeRepository,
            UserRepository userRepository,
            NotificationService notificationService) {

        this.leaveRepository = leaveRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ==========================================
    // APPLY FOR LEAVE + NOTIFY HR
    // ==========================================

    public LeaveRequest applyLeave(LeaveRequest leaveRequest) {

        if (leaveRequest.getEmployeeId() == null) {
            throw new IllegalArgumentException(
                    "Employee ID is required");
        }

        if (leaveRequest.getStartDate() == null ||
                leaveRequest.getEndDate() == null) {
            throw new IllegalArgumentException(
                    "Leave dates are required");
        }

        if (leaveRequest.getEndDate()
                .isBefore(leaveRequest.getStartDate())) {
            throw new IllegalArgumentException(
                    "End date cannot be before start date");
        }

        Employee employee = employeeRepository
                .findById(leaveRequest.getEmployeeId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Employee not found"));

        leaveRequest.setStatus("PENDING");

        LeaveRequest savedLeave =
                leaveRepository.save(leaveRequest);

        // Notify all registered HR managers
        List<User> hrManagers = userRepository.findAll()
                .stream()
                .filter(user -> user.getRoles() != null)
                .filter(user -> user.getRoles().stream()
                        .anyMatch(role ->
                                role.getName() == UserRole.HR_MANAGER))
                .toList();

        for (User hrManager : hrManagers) {

            if (hrManager.getEmail() != null &&
                    !hrManager.getEmail().isBlank()) {

                notificationService.notifyLeaveApplicationSubmitted(
                        hrManager.getEmail(),
                        employee,
                        savedLeave
                );
            }
        }

        return savedLeave;
    }

    // ==========================================
    // GET ALL LEAVE REQUESTS
    // ==========================================

    @Transactional(readOnly = true)
    public List<LeaveRequest> getAllLeaves() {

        return leaveRepository.findAll();
    }

    // ==========================================
    // GET LEAVES BY EMPLOYEE ID
    // ==========================================

    @Transactional(readOnly = true)
    public List<LeaveRequest> getLeavesByEmployee(Long employeeId) {

        if (employeeId == null) {
            throw new IllegalArgumentException(
                    "Employee ID is required");
        }

        return leaveRepository.findByEmployeeId(employeeId);
    }

    // ==========================================
    // GET LEAVE BY ID
    // ==========================================

    @Transactional(readOnly = true)
    public LeaveRequest getLeaveById(Long id) {

        return leaveRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Leave request not found: " + id));
    }

    // ==========================================
    // APPROVE OR REJECT LEAVE
    // + AUTOMATIC EMPLOYEE NOTIFICATION
    // ==========================================

    public LeaveRequest updateLeaveStatus(
            Long id,
            String status) {

        LeaveRequest leave = getLeaveById(id);

        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException(
                    "Status is required");
        }

        status = status.trim().toUpperCase(Locale.ROOT);

        if (!status.equals("APPROVED") &&
                !status.equals("REJECTED")) {

            throw new IllegalArgumentException(
                    "Status must be APPROVED or REJECTED");
        }

        if (!"PENDING".equals(leave.getStatus())) {
            throw new IllegalStateException(
                    "Only pending leave requests can be updated");
        }

        Employee employee = employeeRepository
                .findById(leave.getEmployeeId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Employee not found"));

        leave.setStatus(status);

        LeaveRequest updatedLeave =
                leaveRepository.save(leave);

        // Notify employee only if an application account exists
        if (userRepository.existsByEmailIgnoreCase(
                employee.getEmail())) {

            if ("APPROVED".equals(status)) {

                notificationService.notifyLeaveApproved(
                        employee.getEmail());

            } else {

                notificationService.notifyLeaveRejected(
                        employee.getEmail());
            }
        }

        return updatedLeave;
    }

    // ==========================================
    // DELETE LEAVE
    // ==========================================

    public void deleteLeave(Long id) {

        LeaveRequest leave = getLeaveById(id);

        leaveRepository.delete(leave);
    }
}

