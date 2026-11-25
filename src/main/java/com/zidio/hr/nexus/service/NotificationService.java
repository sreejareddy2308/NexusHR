
package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.entity.LeaveRequest;
import com.zidio.hr.nexus.entity.Notification;
import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.repository.NotificationRepository;
import com.zidio.hr.nexus.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class NotificationService {

    private static final Logger logger =
            LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository repository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public NotificationService(
            NotificationRepository repository,
            UserRepository userRepository,
            EmailService emailService) {

        this.repository = repository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // ==========================================
    // CREATE NOTIFICATION + SEND EMAIL
    // ==========================================

    @Transactional
    public Notification createNotification(
            String recipientEmail,
            String title,
            String message,
            String type) {

        if (recipientEmail == null || recipientEmail.isBlank()
                || title == null || title.isBlank()
                || message == null || message.isBlank()
                || type == null || type.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Recipient email, title, message and type are required"
            );
        }

        User recipient = userRepository
                .findByEmailIgnoreCase(recipientEmail.trim())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Recipient user not found"
                        )
                );

        Notification notification = new Notification();

        notification.setRecipientEmail(recipient.getEmail());
        notification.setTitle(title.trim());
        notification.setMessage(message.trim());
        notification.setType(type.trim());
        notification.setRead(false);

        // Save in-app notification first
        Notification savedNotification = repository.save(notification);

        // Send email separately; email failure must not block in-app notification
        try {
            emailService.sendEmail(
                    recipient.getEmail(),
                    title.trim(),
                    message.trim()
            );

            logger.info(
                    "Notification email sent to {} for type {}",
                    recipient.getEmail(),
                    type
            );

        } catch (Exception exception) {

            logger.error(
                    "Could not send notification email to {}. " +
                            "In-app notification was saved.",
                    recipient.getEmail(),
                    exception
            );
        }

        return savedNotification;
    }

    // ==========================================
    // AUTOMATIC NOTIFICATION METHODS
    // ==========================================

    // Employee registration
    public Notification sendWelcomeNotification(String employeeEmail) {

        return createNotification(
                employeeEmail,
                "Welcome to NexusHR!",
                "Your employee account has been successfully created.",
                "EMPLOYEE"
        );
    }

    // Leave application submitted - EXISTING METHOD
    public Notification notifyLeaveApplicationSubmitted(
            String hrEmail,
            String employeeName) {

        return createNotification(
                hrEmail,
                "New Leave Application",
                employeeName +
                        " has submitted a leave application. Please review it.",
                "LEAVE"
        );
    }

    // Detailed employee leave request notification to HR
    public Notification notifyLeaveApplicationSubmitted(
            String hrEmail,
            Employee employee,
            LeaveRequest leave) {

        String reason = (leave.getReason() == null ||
                leave.getReason().isBlank())
                ? "Not provided"
                : leave.getReason();

        String message =
                "A new leave application has been submitted.\n\n" +
                        "Employee Name: " + employee.getEmployeeName() + "\n" +
                        "Employee ID: " + employee.getId() + "\n" +
                        "Leave Request ID: " + leave.getId() + "\n" +
                        "Leave Type: " + leave.getLeaveType() + "\n" +
                        "Start Date: " + leave.getStartDate() + "\n" +
                        "End Date: " + leave.getEndDate() + "\n" +
                        "Reason: " + reason + "\n" +
                        "Status: " + leave.getStatus() + "\n\n" +
                        "Please review this leave application.";

        return createNotification(
                hrEmail,
                "New Leave Application - " + employee.getEmployeeName(),
                message,
                "LEAVE"
        );
    }

    // Leave approved
    public Notification notifyLeaveApproved(String employeeEmail) {

        return createNotification(
                employeeEmail,
                "Leave Application Approved",
                "Your leave application has been approved.",
                "LEAVE"
        );
    }

    // Leave rejected
    public Notification notifyLeaveRejected(String employeeEmail) {

        return createNotification(
                employeeEmail,
                "Leave Application Rejected",
                "Your leave application has been rejected. " +
                        "Please contact HR for details.",
                "LEAVE"
        );
    }

    // Attendance update
    public Notification notifyAttendanceUpdate(
            String employeeEmail,
            String attendanceMessage) {

        return createNotification(
                employeeEmail,
                "Attendance Update",
                attendanceMessage,
                "ATTENDANCE"
        );
    }

    // Payslip generated
    public Notification notifyPayslipGenerated(
            String employeeEmail,
            String month) {

        return createNotification(
                employeeEmail,
                "Payslip Generated",
                "Your payslip for " + month + " is now available.",
                "PAYROLL"
        );
    }

    // Password or account security event
    public Notification notifySecurityEvent(
            String employeeEmail,
            String securityMessage) {

        return createNotification(
                employeeEmail,
                "Account Security Alert",
                securityMessage,
                "SECURITY"
        );
    }

    // ==========================================
    // GET NOTIFICATIONS
    // ==========================================

    @Transactional(readOnly = true)
    public List<Notification> getNotifications(String email) {

        return repository
                .findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(
                        email.trim()
                );
    }

    // ==========================================
    // GET UNREAD COUNT
    // ==========================================

    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {

        return repository
                .countByRecipientEmailIgnoreCaseAndIsReadFalse(
                        email.trim()
                );
    }

    // ==========================================
    // MARK ONE NOTIFICATION AS READ
    // ==========================================

    @Transactional
    public Notification markAsRead(Long id, String email) {

        Notification notification = repository
                .findByIdAndRecipientEmailIgnoreCase(id, email.trim())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Notification not found"
                        )
                );

        notification.setRead(true);

        return repository.save(notification);
    }

    // ==========================================
    // MARK ALL NOTIFICATIONS AS READ
    // ==========================================

    @Transactional
    public void markAllAsRead(String email) {

        List<Notification> notifications =
                repository.findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(
                        email.trim()
                );

        notifications.forEach(notification ->
                notification.setRead(true)
        );

        repository.saveAll(notifications);
    }

    // ==========================================
    // DELETE NOTIFICATION
    // ==========================================

    @Transactional
    public void deleteNotification(Long id, String email) {

        Notification notification = repository
                .findByIdAndRecipientEmailIgnoreCase(id, email.trim())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Notification not found"
                        )
                );

        repository.delete(notification);
    }
}

