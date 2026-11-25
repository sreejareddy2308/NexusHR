package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.dto.PerformanceGoalDTO;
import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.entity.PerformanceGoal;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.repository.PerformanceGoalRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PerformanceGoalService {

    private final PerformanceGoalRepository goalRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;

    // Create performance goal and notify employee
    public PerformanceGoalDTO createGoal(PerformanceGoalDTO dto) {

        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() ->
                        new RuntimeException("Employee not found"));

        PerformanceGoal goal = new PerformanceGoal();

        goal.setTitle(dto.getTitle());
        goal.setDescription(dto.getDescription());
        goal.setProgress(0);
        goal.setStatus("NOT_STARTED");
        goal.setDueDate(dto.getDueDate());
        goal.setEmployee(employee);

        PerformanceGoal savedGoal = goalRepository.save(goal);

        // Notify employee about new goal
        try {
            notificationService.createNotification(
                    employee.getEmail(),
                    "New Performance Goal Assigned",
                    "A new performance goal has been assigned to you: "
                            + savedGoal.getTitle(),
                    "PERFORMANCE"
            );
        } catch (Exception e) {
            System.err.println(
                    "Goal notification failed: " + e.getMessage());
        }

        return convertToDTO(savedGoal);
    }

    // Get all performance goals
    @Transactional(readOnly = true)
    public List<PerformanceGoalDTO> getAllGoals() {

        return goalRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get goal by ID
    @Transactional(readOnly = true)
    public PerformanceGoalDTO getGoalById(Long id) {

        PerformanceGoal goal = goalRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Performance goal not found"));

        return convertToDTO(goal);
    }

    // Get goals by employee ID
    @Transactional(readOnly = true)
    public List<PerformanceGoalDTO> getGoalsByEmployee(Long employeeId) {

        return goalRepository.findByEmployee_Id(employeeId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Update performance goal and notify on status change
    public PerformanceGoalDTO updateGoal(
            Long id, PerformanceGoalDTO dto) {

        PerformanceGoal goal = goalRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Performance goal not found"));

        String oldStatus = goal.getStatus();

        if (dto.getTitle() != null) {
            goal.setTitle(dto.getTitle());
        }

        if (dto.getDescription() != null) {
            goal.setDescription(dto.getDescription());
        }

        if (dto.getDueDate() != null) {
            goal.setDueDate(dto.getDueDate());
        }

        if (dto.getProgress() != null) {

            if (dto.getProgress() < 0 || dto.getProgress() > 100) {
                throw new IllegalArgumentException(
                        "Progress must be between 0 and 100");
            }

            goal.setProgress(dto.getProgress());

            if (dto.getProgress() == 100) {
                goal.setStatus("COMPLETED");
            } else if (dto.getProgress() > 0) {
                goal.setStatus("IN_PROGRESS");
            } else {
                goal.setStatus("NOT_STARTED");
            }
        }

        PerformanceGoal savedGoal = goalRepository.save(goal);

        String newStatus = savedGoal.getStatus();

        // Notify employee only when status changes
        if (oldStatus == null ||
                !newStatus.equalsIgnoreCase(oldStatus)) {

            try {
                String title = null;
                String message = null;

                if ("IN_PROGRESS".equalsIgnoreCase(newStatus)) {

                    title = "Performance Goal Started";
                    message = "You have started working on your goal: "
                            + savedGoal.getTitle();

                } else if ("COMPLETED".equalsIgnoreCase(newStatus)) {

                    title = "Performance Goal Completed";
                    message = "Congratulations! You completed your goal: "
                            + savedGoal.getTitle();
                }

                if (title != null) {
                    notificationService.createNotification(
                            savedGoal.getEmployee().getEmail(),
                            title,
                            message,
                            "PERFORMANCE"
                    );
                }

            } catch (Exception e) {
                System.err.println(
                        "Goal status notification failed: "
                                + e.getMessage());
            }
        }

        return convertToDTO(savedGoal);
    }

    // Delete performance goal
    public void deleteGoal(Long id) {

        if (!goalRepository.existsById(id)) {
            throw new RuntimeException("Performance goal not found");
        }

        goalRepository.deleteById(id);
    }

    // Convert entity to DTO
    private PerformanceGoalDTO convertToDTO(PerformanceGoal goal) {

        return PerformanceGoalDTO.builder()
                .id(goal.getId())
                .employeeId(goal.getEmployee().getId())
                .employeeName(goal.getEmployee().getEmployeeName())
                .title(goal.getTitle())
                .description(goal.getDescription())
                .progress(goal.getProgress())
                .status(goal.getStatus())
                .dueDate(goal.getDueDate())
                .createdAt(goal.getCreatedAt())
                .build();
    }
}

