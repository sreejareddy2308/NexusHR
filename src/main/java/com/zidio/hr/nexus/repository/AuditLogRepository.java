package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserEmail(String userEmail);

    List<AuditLog> findByModule(String module);

    List<AuditLog> findAllByOrderByCreatedAtDesc();
}

