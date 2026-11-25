package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeaveRequestRepository
        extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeId(Long employeeId);

    List<LeaveRequest> findByStatus(String status);

    // AI insights analytics query
    long countByStatus(String status);
}

