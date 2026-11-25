package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.entity.Document;
import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.repository.DocumentRepository;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.service.DocumentService;

import lombok.RequiredArgsConstructor;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;

    // Admin/HR upload document
    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Document> uploadDocument(
            @RequestParam Long employeeId,
            @RequestParam("file") MultipartFile file) {

        Document document =
                documentService.uploadDocument(employeeId, file);

        return ResponseEntity.ok(document);
    }

    // Employee uploads own document
    @PostMapping("/me/upload")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Document> uploadMyDocument(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        Employee employee = getAuthenticatedEmployee(authentication);

        Document document = documentService.uploadDocument(
                employee.getId(), file
        );

        return ResponseEntity.ok(document);
    }

    // Admin/HR views employee documents
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<Document>> getEmployeeDocuments(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                documentService.getEmployeeDocuments(employeeId)
        );
    }

    // Admin/HR views all active documents
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<Document>> getAllDocuments() {

        return ResponseEntity.ok(
                documentRepository.findAllByDeletedFalse()
        );
    }

    // Employee views own active documents
    @GetMapping("/me")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<Document>> getMyDocuments(
            Authentication authentication) {

        Employee employee = getAuthenticatedEmployee(authentication);

        return ResponseEntity.ok(
                documentService.getEmployeeDocuments(employee.getId())
        );
    }

    // HR/Admin verifies an uploaded document
    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Document> verifyDocument(
            @PathVariable Long id,
            Authentication authentication) {

        Document verified = documentService.verifyDocument(
                id,
                authentication.getName()
        );

        return ResponseEntity.ok(verified);
    }

    // HR/Admin rejects an uploaded document
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Document> rejectDocument(
            @PathVariable Long id,
            @RequestParam String reason,
            Authentication authentication) {

        Document rejected = documentService.rejectDocument(
                id,
                authentication.getName(),
                reason
        );

        return ResponseEntity.ok(rejected);
    }

    // Download active document
    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long id,
            Authentication authentication) {

        Document document = documentRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Document not found"
                ));

        boolean isAdminOrHR = isAdminOrHR(authentication);

        if (!isAdminOrHR) {

            Employee employee = getAuthenticatedEmployee(authentication);

            if (!document.getEmployeeId().equals(employee.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You are not allowed to download this document"
                );
            }
        }

        Path filePath = Path.of(document.getFilePath());

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Document file not found"
            );
        }

        Resource resource = new FileSystemResource(filePath);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" +
                                document.getDocumentName().replace("\"", "") +
                                "\""
                )
                .body(resource);
    }

    // Delete document (Soft delete)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            Authentication authentication) {

        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Document not found"
                ));

        boolean isAdminOrHR = isAdminOrHR(authentication);

        if (!isAdminOrHR) {

            Employee employee = getAuthenticatedEmployee(authentication);

            if (!document.getEmployeeId().equals(employee.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You are not allowed to delete this document"
                );
            }
        }

        if (document.isDeleted()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Document is already deleted"
            );
        }

        documentService.deleteDocument(id);

        return ResponseEntity.noContent().build();
    }

    // Restore deleted document (Undo)
    @PostMapping("/{id}/restore")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<Document> restoreDocument(
            @PathVariable Long id,
            Authentication authentication) {

        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Document not found"
                ));

        if (!document.isDeleted()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Document is not deleted"
            );
        }

        boolean isAdminOrHR = isAdminOrHR(authentication);

        if (!isAdminOrHR) {

            Employee employee = getAuthenticatedEmployee(authentication);

            if (!document.getEmployeeId().equals(employee.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You are not allowed to restore this document"
                );
            }
        }

        Document restored = documentService.restoreDocument(id);

        return ResponseEntity.ok(restored);
    }

    // Check Admin/HR role
    private boolean isAdminOrHR(Authentication authentication) {

        return authentication != null &&
                authentication.getAuthorities().stream()
                        .anyMatch(authority ->
                                authority.getAuthority().equals("ROLE_ADMIN")
                                        || authority.getAuthority().equals("ROLE_HR_MANAGER")
                        );
    }

    // Get authenticated employee
    private Employee getAuthenticatedEmployee(
            Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        return employeeRepository
                .findByEmailAndActiveTrue(authentication.getName().trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No active employee record found for this account"
                ));
    }
}

