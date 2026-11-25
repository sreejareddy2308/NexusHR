package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRepository
        extends JpaRepository<LeaveRequest, Long> {

    // Find all leaves of an employee
    List<LeaveRequest> findByEmployeeId(Long employeeId);

    // Find leaves by status
    List<LeaveRequest> findByStatus(String status);

    // Find employee leaves by status
    List<LeaveRequest> findByEmployeeIdAndStatus(
            Long employeeId,
            String status
    );

    // Find all leaves sorted by latest first
    List<LeaveRequest> findAllByOrderByCreatedAtDesc();
}



