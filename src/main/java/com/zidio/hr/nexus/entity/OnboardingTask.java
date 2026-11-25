package com.zidio.hr.nexus.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "onboarding_tasks")
public class OnboardingTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "onboarding_id", nullable = false)
    @JsonBackReference
    private Onboarding onboarding;

    @Column(nullable = false)
    private String taskName;

    @Column(nullable = false)
    private boolean mandatory = true;

    @Column(nullable = false)
    private String status = "PENDING";

    public Long getId() {
        return id;
    }

    public Onboarding getOnboarding() {
        return onboarding;
    }

    public void setOnboarding(Onboarding onboarding) {
        this.onboarding = onboarding;
    }

    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public boolean isMandatory() {
        return mandatory;
    }

    public void setMandatory(boolean mandatory) {
        this.mandatory = mandatory;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

