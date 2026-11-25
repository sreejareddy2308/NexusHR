package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    // Get all notifications for a user
    List<Notification> findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(
            String recipientEmail
    );

    // Count unread notifications
    long countByRecipientEmailIgnoreCaseAndIsReadFalse(
            String recipientEmail
    );

    // Find notification belonging to a specific user
    Optional<Notification> findByIdAndRecipientEmailIgnoreCase(
            Long id,
            String recipientEmail
    );
}

