package com.zidio.hr.nexus.controller;

import com.zidio.hr.nexus.entity.AuditLog;
import com.zidio.hr.nexus.service.AuditLogService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

        import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        return ResponseEntity.ok(
                auditLogService.getAllLogs()
        );
    }

    @GetMapping("/user/{email}")
    public ResponseEntity<List<AuditLog>> getLogsByUser(
            @PathVariable String email) {

        return ResponseEntity.ok(
                auditLogService.getLogsByUser(email)
        );
    }

    @GetMapping("/module/{module}")
    public ResponseEntity<List<AuditLog>> getLogsByModule(
            @PathVariable String module) {

        return ResponseEntity.ok(
                auditLogService.getLogsByModule(module)
        );
    }
}

