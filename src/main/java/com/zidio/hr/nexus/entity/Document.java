package com.zidio.hr.nexus.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "employee_documents")
@Getter
@Setter
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private String documentName;

    @Column(nullable = false)
    private String documentType;

    @Column(nullable = false, unique = true)
    private String fileName;

    @Column(nullable = false)
    private String filePath;

    private Long fileSize;

    private LocalDateTime uploadedAt;

    @Column(nullable = false)
    private boolean deleted = false;

    // New onboarding verification fields
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 20)
    private DocumentVerificationStatus verificationStatus =
            DocumentVerificationStatus.PENDING;

    @Column(name = "reviewed_by")
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @PrePersist
    protected void onCreate() {
        if (uploadedAt == null) {
            uploadedAt = LocalDateTime.now();
        }

        if (verificationStatus == null) {
            verificationStatus = DocumentVerificationStatus.PENDING;
        }
    }
}

