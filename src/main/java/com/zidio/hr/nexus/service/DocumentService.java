package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.Document;
import com.zidio.hr.nexus.entity.DocumentVerificationStatus;
import com.zidio.hr.nexus.repository.DocumentRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;

    @Value("${app.document.upload-dir:uploads/documents}")
    private String uploadDirectory;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png"
    );

    // Upload document
    @Transactional
    public Document uploadDocument(Long employeeId, MultipartFile file) {

        if (employeeId == null || employeeId <= 0) {
            throw new IllegalArgumentException("Invalid employee ID");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "Maximum file size is 5 MB"
            );
        }

        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException(
                    "Unsupported document type"
            );
        }

        String originalName = StringUtils.cleanPath(
                file.getOriginalFilename() == null
                        ? "document"
                        : file.getOriginalFilename()
        );

        if (originalName.contains("..")) {
            throw new IllegalArgumentException("Invalid file name");
        }

        String extension =
                StringUtils.getFilenameExtension(originalName);

        String storedName = UUID.randomUUID()
                + (extension == null ? "" : "." + extension);

        Path directory = Paths.get(uploadDirectory)
                .toAbsolutePath()
                .normalize();

        Path target = directory.resolve(storedName).normalize();

        if (!target.startsWith(directory)) {
            throw new IllegalArgumentException("Invalid file path");
        }

        try {
            Files.createDirectories(directory);

            file.transferTo(target);

            Document document = new Document();

            document.setEmployeeId(employeeId);
            document.setDocumentName(originalName);
            document.setDocumentType(file.getContentType());
            document.setFileName(storedName);
            document.setFilePath(target.toString());
            document.setFileSize(file.getSize());
            document.setDeleted(false);

            // Every newly uploaded document requires HR verification.
            document.setVerificationStatus(
                    DocumentVerificationStatus.PENDING
            );

            document.setReviewedBy(null);
            document.setReviewedAt(null);
            document.setRejectionReason(null);

            return documentRepository.save(document);

        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Unable to store document",
                    exception
            );
        }
    }

    // Get active documents belonging to an employee
    public List<Document> getEmployeeDocuments(Long employeeId) {

        return documentRepository
                .findByEmployeeIdAndDeletedFalse(employeeId);
    }

    // Verify document (HR operation)
    @Transactional
    public Document verifyDocument(Long documentId, String reviewerEmail) {

        if (reviewerEmail == null || reviewerEmail.isBlank()) {
            throw new IllegalArgumentException(
                    "Reviewer information is required"
            );
        }

        Document document = getActiveDocument(documentId);

        if (document.getVerificationStatus()
                == DocumentVerificationStatus.VERIFIED) {
            throw new IllegalArgumentException(
                    "Document is already verified"
            );
        }

        document.setVerificationStatus(
                DocumentVerificationStatus.VERIFIED
        );

        document.setReviewedBy(reviewerEmail);
        document.setReviewedAt(LocalDateTime.now());
        document.setRejectionReason(null);

        return documentRepository.save(document);
    }

    // Reject document (HR operation)
    @Transactional
    public Document rejectDocument(
            Long documentId,
            String reviewerEmail,
            String rejectionReason
    ) {

        if (reviewerEmail == null || reviewerEmail.isBlank()) {
            throw new IllegalArgumentException(
                    "Reviewer information is required"
            );
        }

        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new IllegalArgumentException(
                    "Rejection reason is required"
            );
        }

        Document document = getActiveDocument(documentId);

        document.setVerificationStatus(
                DocumentVerificationStatus.REJECTED
        );

        document.setReviewedBy(reviewerEmail);
        document.setReviewedAt(LocalDateTime.now());
        document.setRejectionReason(rejectionReason.trim());

        return documentRepository.save(document);
    }

    // Find active document for verification
    private Document getActiveDocument(Long documentId) {

        if (documentId == null || documentId <= 0) {
            throw new IllegalArgumentException(
                    "Invalid document ID"
            );
        }

        return documentRepository.findByIdAndDeletedFalse(documentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Active document not found: " + documentId
                        )
                );
    }

    // Soft delete document
    @Transactional
    public void deleteDocument(Long documentId) {

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Document not found: " + documentId
                        )
                );

        if (document.isDeleted()) {
            throw new IllegalArgumentException(
                    "Document is already deleted"
            );
        }

        // Mark as deleted without deleting physical file
        document.setDeleted(true);

        documentRepository.save(document);
    }

    // Restore deleted document (Undo)
    @Transactional
    public Document restoreDocument(Long documentId) {

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Document not found: " + documentId
                        )
                );

        if (!document.isDeleted()) {
            throw new IllegalArgumentException(
                    "Document is not deleted"
            );
        }

        // Restore document
        document.setDeleted(false);

        return documentRepository.save(document);
    }
}

