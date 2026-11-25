package com.zidio.hr.nexus.service;
import com.zidio.hr.nexus.dto.AIInsightsResponse;
import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.repository.EmployeeRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AIInsightsServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private AIInsightsService aiInsightsService;

    private Employee createEmployee(
            String department,
            String jobTitle,
            boolean active,
            LocalDate joiningDate) {

        Employee employee = new Employee();

        employee.setDepartment(department);
        employee.setJobTitle(jobTitle);
        employee.setActive(active);
        employee.setJoiningDate(joiningDate);

        return employee;
    }

    @Test
    void shouldCalculateEmployeeStatisticsCorrectly() {

        LocalDate today = LocalDate.now();

        Employee employee1 = createEmployee(
                "IT",
                "Java Developer",
                true,
                today.minusYears(2)
        );

        Employee employee2 = createEmployee(
                "HR",
                "HR Manager",
                true,
                today.minusMonths(6)
        );

        Employee employee3 = createEmployee(
                "Finance",
                "Accountant",
                false,
                today.minusYears(1)
        );

        when(employeeRepository.findAll())
                .thenReturn(List.of(
                        employee1,
                        employee2,
                        employee3
                ));

        AIInsightsResponse response =
                aiInsightsService.getWorkforceInsights();

        assertEquals(3, response.totalEmployees());
        assertEquals(2, response.activeEmployees());
        assertEquals(1, response.inactiveEmployees());

        assertEquals(2, response.employeesByDepartment().size());

        assertEquals(1L,
                response.employeesByDepartment().get("IT"));

        assertEquals(1L,
                response.employeesByDepartment().get("HR"));

        assertEquals(2, response.employeesByJobTitle().size());

        assertNotNull(response.recommendations());
        assertFalse(response.recommendations().isEmpty());

        assertTrue(response.averageTenureYears() > 0);
        assertNotNull(response.employeesByTenure());
    }

    @Test
    void shouldGroupJobTitlesCaseInsensitively() {

        LocalDate today = LocalDate.now();

        Employee employee1 = createEmployee(
                "IT",
                "Java Developer",
                true,
                today.minusYears(1)
        );

        Employee employee2 = createEmployee(
                "IT",
                "java developer",
                true,
                today.minusYears(2)
        );

        when(employeeRepository.findAll())
                .thenReturn(List.of(employee1, employee2));

        AIInsightsResponse response =
                aiInsightsService.getWorkforceInsights();

        assertEquals(1, response.employeesByJobTitle().size());

        assertEquals(
                2L,
                response.employeesByJobTitle()
                        .get("Java Developer")
        );

        assertEquals(1, response.employeesByDepartment().size());
        assertEquals(
                2L,
                response.employeesByDepartment().get("IT")
        );
    }

    @Test
    void shouldHandleEmptyEmployeeDatabase() {

        when(employeeRepository.findAll())
                .thenReturn(List.of());

        AIInsightsResponse response =
                aiInsightsService.getWorkforceInsights();

        assertEquals(0, response.totalEmployees());
        assertEquals(0, response.activeEmployees());
        assertEquals(0, response.inactiveEmployees());

        assertTrue(response.employeesByDepartment().isEmpty());
        assertTrue(response.employeesByJobTitle().isEmpty());

        assertEquals(0.0, response.averageTenureYears());

        assertEquals(
                "Add employee records to begin workforce analytics.",
                response.recommendations().get(0)
        );
    }

    @Test
    void shouldGenerateRecommendationsForMissingEmployeeData() {

        Employee employee = createEmployee(
                null,
                " ",
                true,
                null
        );

        when(employeeRepository.findAll())
                .thenReturn(List.of(employee));

        AIInsightsResponse response =
                aiInsightsService.getWorkforceInsights();

        assertEquals(1, response.totalEmployees());

        assertEquals(
                1L,
                response.employeesByDepartment().get("Unassigned")
        );

        assertEquals(
                1L,
                response.employeesByJobTitle().get("Unassigned")
        );

        assertTrue(response.recommendations().stream()
                .anyMatch(r -> r.contains("no department assigned")));

        assertTrue(response.recommendations().stream()
                .anyMatch(r -> r.contains("no job title assigned")));

        assertTrue(response.recommendations().stream()
                .anyMatch(r -> r.contains("no joining date assigned")));

        assertEquals(
                1L,
                response.employeesByTenure().get("Unknown")
        );
    }
}

