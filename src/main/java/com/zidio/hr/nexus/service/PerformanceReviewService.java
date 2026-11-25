package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.entity.PerformanceReview;
import com.zidio.hr.nexus.repository.PerformanceReviewRepository;
import com.zidio.hr.nexus.repository.EmployeeRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PerformanceReviewService {

    private final PerformanceReviewRepository repository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;

    public PerformanceReviewService(
            PerformanceReviewRepository repository,
            EmployeeRepository employeeRepository,
            NotificationService notificationService) {

        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.notificationService = notificationService;
    }

    public PerformanceReview createReview(PerformanceReview review) {

        Employee employee = employeeRepository.findById(
                review.getEmployeeId()
        ).orElseThrow(() ->
                new RuntimeException("Employee not found"));

        validateGoals(review);

        review.setStatus("PENDING");

        PerformanceReview savedReview = repository.save(review);

        // Notify employee
        sendNotification(
                employee.getEmail(),
                "Performance Review Created",
                "A new performance review has been created for you."
        );

        // Notify reviewer
        sendNotification(
                savedReview.getReviewerEmail(),
                "New Performance Review Assigned",
                "A new performance review has been assigned to you."
        );

        return savedReview;
    }

    public List<PerformanceReview> getAllReviews() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public PerformanceReview getReviewById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Performance review not found: " + id));
    }

    public List<PerformanceReview> getReviewsByEmployee(
            Long employeeId) {

        return repository.findByEmployeeId(employeeId);
    }

    @Transactional
    public PerformanceReview updateReview(
            Long id,
            PerformanceReview updatedReview) {

        PerformanceReview review = getReviewById(id);

        validateGoals(updatedReview);

        review.setRating(updatedReview.getRating());
        review.setFeedback(updatedReview.getFeedback());
        review.setStrengths(updatedReview.getStrengths());
        review.setImprovementAreas(
                updatedReview.getImprovementAreas());
        review.setGoalsAchieved(updatedReview.getGoalsAchieved());
        review.setTotalGoals(updatedReview.getTotalGoals());

        return repository.save(review);
    }

    @Transactional
    public PerformanceReview updateStatus(
            Long id, String status) {

        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException(
                    "Status is required");
        }

        String normalizedStatus = status.trim().toUpperCase();

        if (!List.of("PENDING", "COMPLETED", "APPROVED")
                .contains(normalizedStatus)) {
            throw new IllegalArgumentException(
                    "Invalid review status");
        }

        PerformanceReview review = getReviewById(id);

        String previousStatus = review.getStatus();

        review.setStatus(normalizedStatus);

        PerformanceReview savedReview = repository.save(review);

        // Notify employee only when status actually changes
        if (!normalizedStatus.equalsIgnoreCase(previousStatus)
                && ("COMPLETED".equals(normalizedStatus)
                || "APPROVED".equals(normalizedStatus))) {

            Employee employee = employeeRepository.findById(
                    review.getEmployeeId()
            ).orElse(null);

            if (employee != null) {

                if ("COMPLETED".equals(normalizedStatus)) {
                    sendNotification(
                            employee.getEmail(),
                            "Performance Review Completed",
                            "Your performance review has been completed."
                    );
                }

                if ("APPROVED".equals(normalizedStatus)) {
                    sendNotification(
                            employee.getEmail(),
                            "Performance Review Approved",
                            "Your performance review has been approved."
                    );
                }
            }
        }

        return savedReview;
    }

    public void deleteReview(Long id) {
        PerformanceReview review = getReviewById(id);
        repository.delete(review);
    }

    private void sendNotification(
            String email,
            String title,
            String message) {

        if (email == null || email.isBlank()) {
            return;
        }

        try {
            notificationService.createNotification(
                    email,
                    title,
                    message,
                    "PERFORMANCE"
            );
        } catch (Exception e) {
            // Notification failure must not block performance operations.
        }
    }

    private void validateGoals(PerformanceReview review) {

        Integer achieved = review.getGoalsAchieved();
        Integer total = review.getTotalGoals();

        if (achieved != null && achieved < 0) {
            throw new IllegalArgumentException(
                    "Goals achieved cannot be negative");
        }

        if (total != null && total < 0) {
            throw new IllegalArgumentException(
                    "Total goals cannot be negative");
        }

        if (achieved != null && total != null && achieved > total) {
            throw new IllegalArgumentException(
                    "Goals achieved cannot exceed total goals");
        }
    }
}

