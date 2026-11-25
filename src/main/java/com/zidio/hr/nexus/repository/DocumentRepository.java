package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    // Find all documents belonging to an employee
    List<Document> findByEmployeeId(Long employeeId);

    // Find a particular document belonging to an employee
    Optional<Document> findByIdAndEmployeeId(Long id, Long employeeId);

    // Find only active documents belonging to an employee
    List<Document> findByEmployeeIdAndDeletedFalse(Long employeeId);

    // Find all active documents
    List<Document> findAllByDeletedFalse();

    // Find a document only if it is not deleted
    Optional<Document> findByIdAndDeletedFalse(Long id);
}

