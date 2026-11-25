package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.dto.OnboardingRequest;
import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.entity.Onboarding;
import com.zidio.hr.nexus.entity.OnboardingTask;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.repository.OnboardingRepository;
import com.zidio.hr.nexus.repository.OnboardingTaskRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class OnboardingService {

    private final OnboardingRepository onboardingRepository;
    private final OnboardingTaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;

    public OnboardingService(
            OnboardingRepository onboardingRepository,
            OnboardingTaskRepository taskRepository,
            EmployeeRepository employeeRepository) {
        this.onboardingRepository = onboardingRepository;
        this.taskRepository = taskRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public Onboarding create(OnboardingRequest request) {

        Employee employee = employeeRepository
                .findById(request.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Employee not found"));

        if (onboardingRepository.existsByEmployee_Id(employee.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Onboarding already exists for this employee");
        }

        Onboarding onboarding = new Onboarding();
        onboarding.setEmployee(employee);
        onboarding.setJoiningDate(request.getJoiningDate());
        onboarding.setStatus("IN_PROGRESS");

        addTask(onboarding, "Submit required documents");
        addTask(onboarding, "Verify employee documents");
        addTask(onboarding, "Sign company policies");
        addTask(onboarding, "Allocate equipment");
        addTask(onboarding, "Complete orientation");

        return onboardingRepository.save(onboarding);
    }

    private void addTask(Onboarding onboarding, String name) {
        OnboardingTask task = new OnboardingTask();
        task.setTaskName(name);
        task.setMandatory(true);
        task.setStatus("PENDING");
        onboarding.addTask(task);
    }

    @Transactional(readOnly = true)
    public List<Onboarding> getAll() {
        return onboardingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Onboarding getById(Long id) {
        return onboardingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Onboarding record not found"));
    }

    @Transactional(readOnly = true)
    public Onboarding getByEmployeeId(Long employeeId) {
        return onboardingRepository.findByEmployee_Id(employeeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Onboarding record not found"));
    }

    @Transactional
    public Onboarding updateTask(
            Long onboardingId, Long taskId, String newStatus) {

        Onboarding onboarding = onboardingRepository.findById(onboardingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Onboarding record not found"));

        if (!"IN_PROGRESS".equals(onboarding.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tasks cannot be changed after onboarding is completed");
        }

        if (!"PENDING".equals(newStatus)
                && !"COMPLETED".equals(newStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Task status must be PENDING or COMPLETED");
        }

        OnboardingTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Task not found"));

        if (!task.getOnboarding().getId().equals(onboardingId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Task does not belong to this onboarding record");
        }

        task.setStatus(newStatus);
        taskRepository.save(task);

        return onboarding;
    }

    @Transactional
    public Onboarding complete(Long id) {

        Onboarding onboarding = onboardingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Onboarding record not found"));

        boolean pendingMandatoryTask = onboarding.getTasks().stream()
                .anyMatch(task -> task.isMandatory()
                        && !"COMPLETED".equals(task.getStatus()));

        if (pendingMandatoryTask) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Complete all mandatory tasks before finalizing onboarding");
        }

        onboarding.setStatus("COMPLETED");
        onboarding.setCompletedAt(LocalDateTime.now());

        return onboardingRepository.save(onboarding);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getProgress(Long id) {

        Onboarding onboarding = onboardingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Onboarding record not found"));

        long total = onboarding.getTasks().size();

        long completed = onboarding.getTasks().stream()
                .filter(task -> "COMPLETED".equals(task.getStatus()))
                .count();

        int percentage = total == 0
                ? 0
                : (int) (completed * 100 / total);

        return Map.of(
                "onboardingId", onboarding.getId(),
                "employeeId", onboarding.getEmployee().getId(),
                "status", onboarding.getStatus(),
                "totalTasks", total,
                "completedTasks", completed,
                "progressPercentage", percentage
        );
    }
}


