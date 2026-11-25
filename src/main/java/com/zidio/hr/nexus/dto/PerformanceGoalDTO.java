package com.zidio.hr.nexus.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceGoalDTO {

    private Long id;

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    private String employeeName;

    @NotBlank(message = "Goal title is required")
    @Size(max = 150)
    private String title;

    @Size(max = 1000)
    private String description;

    @Min(0)
    @Max(100)
    private Integer progress;

    private String status;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    private LocalDate createdAt;
}

