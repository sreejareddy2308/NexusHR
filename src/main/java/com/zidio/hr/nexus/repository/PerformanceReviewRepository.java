package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.PerformanceReview;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceReviewRepository
        extends JpaRepository<PerformanceReview, Long> {

    // Find reviews by employee ID
    List<PerformanceReview> findByEmployeeId(Long employeeId);

    // Find reviews by status
    List<PerformanceReview> findByStatus(String status);

    // Find reviews by employee and status
    List<PerformanceReview> findByEmployeeIdAndStatus(
            Long employeeId,
            String status
    );

    // Find reviews by reviewer email
    List<PerformanceReview> findByReviewerEmail(
            String reviewerEmail
    );

    // Find reviews by review period
    List<PerformanceReview> findByReviewPeriod(
            String reviewPeriod
    );

    // Display latest reviews first
    List<PerformanceReview> findAllByOrderByCreatedAtDesc();
}

/*
package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.PerformanceReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PerformanceReviewRepository
        extends JpaRepository<PerformanceReview, Long> {

    List<PerformanceReview> findByEmployeeId(Long employeeId);

    List<PerformanceReview> findByStatus(String status);

    List<PerformanceReview>
        findAllByOrderByCreatedAtDesc();
}
 */