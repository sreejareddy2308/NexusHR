package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.entity.PerformanceReview;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.repository.PerformanceReviewRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
public class PerformanceService {

    private final PerformanceReviewRepository performanceRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;

    public PerformanceService(
            PerformanceReviewRepository performanceRepository,
            EmployeeRepository employeeRepository,
            NotificationService notificationService) {

        this.performanceRepository = performanceRepository;
        this.employeeRepository = employeeRepository;
        this.notificationService = notificationService;
    }

    public PerformanceReview createReview(PerformanceReview review) {
        validateReview(review);

        review.setStatus("PENDING");

        PerformanceReview savedReview = performanceRepository.save(review);

        Employee employee = employeeRepository.findById(
                savedReview.getEmployeeId()
        ).orElse(null);

        if (employee != null) {
            sendNotification(
                    employee.getEmail(),
                    "Performance Review Created",
                    "A new performance review has been created for you.",
                    "PERFORMANCE"
            );
        }

        if (savedReview.getReviewerEmail() != null
                && !savedReview.getReviewerEmail().isBlank()) {

            sendNotification(
                    savedReview.getReviewerEmail(),
                    "New Performance Review Assigned",
                    "A new performance review has been assigned to you.",
                    "PERFORMANCE"
            );
        }

        return savedReview;
    }

    public List<PerformanceReview> getAllReviews() {
        return performanceRepository.findAllByOrderByCreatedAtDesc();
    }

    public PerformanceReview getReviewById(Long id) {
        return performanceRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Performance review not found"));
    }

    public List<PerformanceReview> getReviewsByEmployee(Long employeeId) {
        return performanceRepository.findByEmployeeId(employeeId);
    }

    public List<PerformanceReview> getReviewsByReviewer(String reviewerEmail) {
        return performanceRepository.findByReviewerEmail(reviewerEmail);
    }

    public List<PerformanceReview> getReviewsByStatus(String status) {
        return performanceRepository.findByStatus(status);
    }

    public PerformanceReview updateReview(
            Long id,
            PerformanceReview updatedReview) {

        validateReview(updatedReview);

        PerformanceReview existingReview = getReviewById(id);

        existingReview.setReviewPeriod(updatedReview.getReviewPeriod());
        existingReview.setRating(updatedReview.getRating());
        existingReview.setFeedback(updatedReview.getFeedback());
        existingReview.setStrengths(updatedReview.getStrengths());
        existingReview.setImprovementAreas(updatedReview.getImprovementAreas());
        existingReview.setGoalsAchieved(updatedReview.getGoalsAchieved());
        existingReview.setTotalGoals(updatedReview.getTotalGoals());

        return performanceRepository.save(existingReview);
    }

    public PerformanceReview updateReviewStatus(Long id, String status) {

        PerformanceReview review = getReviewById(id);

        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }

        String normalizedStatus = status.trim().toUpperCase();

        if (!List.of("PENDING", "COMPLETED", "APPROVED")
                .contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid review status");
        }

        String previousStatus = review.getStatus();

        review.setStatus(normalizedStatus);

        PerformanceReview savedReview =
                performanceRepository.save(review);

        if (!normalizedStatus.equals(previousStatus)
                && ("COMPLETED".equals(normalizedStatus)
                || "APPROVED".equals(normalizedStatus))) {

            Employee employee = employeeRepository.findById(
                    review.getEmployeeId()
            ).orElse(null);

            if (employee != null) {

                String title = "COMPLETED".equals(normalizedStatus)
                        ? "Performance Review Completed"
                        : "Performance Review Approved";

                String message = "COMPLETED".equals(normalizedStatus)
                        ? "Your performance review has been completed."
                        : "Your performance review has been approved.";

                sendNotification(
                        employee.getEmail(),
                        title,
                        message,
                        "PERFORMANCE"
                );
            }
        }

        return savedReview;
    }

    public void deleteReview(Long id) {
        PerformanceReview review = getReviewById(id);
        performanceRepository.delete(review);
    }

    private void sendNotification(
            String email,
            String title,
            String message,
            String type) {

        if (email == null || email.isBlank()) {
            return;
        }

        try {
            notificationService.createNotification(
                    email,
                    title,
                    message,
                    type
            );
        } catch (Exception e) {
            // Notification failure must not block performance operations.
        }
    }

    private void validateReview(PerformanceReview review) {

        if (review == null) {
            throw new IllegalArgumentException("Review cannot be null");
        }

        if (review.getEmployeeId() == null) {
            throw new IllegalArgumentException("Employee ID is required");
        }

        if (review.getRating() == null
                || review.getRating() < 1
                || review.getRating() > 5) {
            throw new IllegalArgumentException(
                    "Rating must be between 1 and 5");
        }

        if (review.getReviewPeriod() == null
                || review.getReviewPeriod().isBlank()) {
            throw new IllegalArgumentException(
                    "Review period is required");
        }

        if (review.getGoalsAchieved() != null
                && review.getGoalsAchieved() < 0) {
            throw new IllegalArgumentException(
                    "Goals achieved cannot be negative");
        }

        if (review.getTotalGoals() != null
                && review.getTotalGoals() < 0) {
            throw new IllegalArgumentException(
                    "Total goals cannot be negative");
        }

        if (review.getGoalsAchieved() != null
                && review.getTotalGoals() != null
                && review.getGoalsAchieved() > review.getTotalGoals()) {
            throw new IllegalArgumentException(
                    "Goals achieved cannot exceed total goals");
        }
    }
}

