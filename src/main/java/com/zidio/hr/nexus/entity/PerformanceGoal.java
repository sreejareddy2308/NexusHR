package com.zidio.hr.nexus.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "performance_goals")
@Getter
@Setter
@NoArgsConstructor
public class PerformanceGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Goal title is required")
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String title;

    @Size(max = 1000)
    @Column(length = 1000)
    private String description;

    @Min(0)
    @Max(100)
    @Column(nullable = false)
    private Integer progress = 0;

    @NotBlank
    @Column(nullable = false)
    private String status = "NOT_STARTED";

    @NotNull
    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false, updatable = false)
    private LocalDate createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDate.now();
        }
    }
}

