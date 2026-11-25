package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.PerformanceGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceGoalRepository
        extends JpaRepository<PerformanceGoal, Long> {

    List<PerformanceGoal> findByEmployee_Id(Long employeeId);

    List<PerformanceGoal> findByStatus(String status);

    List<PerformanceGoal> findByEmployee_IdAndStatus(
            Long employeeId, String status);
}
