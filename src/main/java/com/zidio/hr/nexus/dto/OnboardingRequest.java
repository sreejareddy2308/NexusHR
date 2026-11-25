package com.zidio.hr.nexus.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.FutureOrPresent;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Setter
@Getter
public class OnboardingRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Joining date is required")
    @FutureOrPresent(message = "Joining date cannot be in the past")
    private LocalDate joiningDate;

}

