package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.entity.Notification;
import com.zidio.hr.nexus.service.NotificationService;
import com.zidio.hr.nexus.dto.NotificationRequest;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    // Get all notifications
    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            Principal principal) {

        return ResponseEntity.ok(
                service.getNotifications(principal.getName())
        );
    }

    // Get unread notification count
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            Principal principal) {

        return ResponseEntity.ok(
                Map.of(
                        "unreadCount",
                        service.getUnreadCount(principal.getName())
                )
        );
    }

    // Mark notification as read
    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable Long id,
            Principal principal) {

        return ResponseEntity.ok(
                service.markAsRead(id, principal.getName())
        );
    }

    // Mark all notifications as read
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(
            Principal principal) {

        service.markAllAsRead(principal.getName());

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "All notifications marked as read"
                )
        );
    }

    // Delete notification
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            Principal principal) {

        service.deleteNotification(id, principal.getName());

        return ResponseEntity.noContent().build();
    }

    // Create notification (Admin / HR only)
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Notification> createNotification(
            @Valid @RequestBody NotificationRequest request) {

        Notification notification = service.createNotification(
                request.getRecipientEmail(),
                request.getTitle(),
                request.getMessage(),
                request.getType()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(notification);
    }
}

