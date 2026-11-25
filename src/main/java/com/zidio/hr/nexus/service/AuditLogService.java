package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.AuditLog;
import com.zidio.hr.nexus.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository repository;

    public AuditLogService(AuditLogRepository repository) {
        this.repository = repository;
    }

    public AuditLog saveLog(
            String userEmail,
            String action,
            String module,
            String description,
            String ipAddress) {

        AuditLog log = new AuditLog(
                userEmail,
                action,
                module,
                description,
                ipAddress
        );

        return repository.save(log);
    }

    public List<AuditLog> getAllLogs() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public List<AuditLog> getLogsByUser(String email) {
        return repository.findByUserEmail(email);
    }

    public List<AuditLog> getLogsByModule(String module) {
        return repository.findByModule(module);
    }
}

