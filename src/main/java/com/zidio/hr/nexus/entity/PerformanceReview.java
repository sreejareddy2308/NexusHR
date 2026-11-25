package com.zidio.hr.nexus.entity;

import jakarta.persistence.*;
        import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "performance_reviews")
public class PerformanceReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @NotNull
    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Setter
    @Column(name = "reviewer_email")
    private String reviewerEmail;

    @Setter
    @NotBlank
    @Column(name = "review_period", nullable = false)
    private String reviewPeriod;

    @Setter
    @Min(1)
    @Max(5)
    @NotNull
    private Integer rating;

    @Setter
    @Column(length = 2000)
    private String feedback;

    @Setter
    @Column(length = 1000)
    private String strengths;

    @Setter
    @Column(name = "improvement_areas", length = 1000)
    private String improvementAreas;

    @Setter
    @Column(name = "goals_achieved")
    private Integer goalsAchieved;

    @Setter
    @Column(name = "total_goals")
    private Integer totalGoals;

    @Setter
    @Column(nullable = false)
    private String status = "PENDING";

    @Setter
    @Column(name = "review_date")
    private LocalDate reviewDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();

        if (reviewDate == null) {
            reviewDate = LocalDate.now();
        }
    }

    public PerformanceReview() {
    }

}
