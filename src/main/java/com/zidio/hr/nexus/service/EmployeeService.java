package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.dto.EmployeeDTO;
import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.exception.ResourceNotFoundException;
import com.zidio.hr.nexus.repository.EmployeeRepository;

import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class EmployeeService {

    private static final Logger logger =
            LoggerFactory.getLogger(EmployeeService.class);

    private final EmployeeRepository employeeRepository;
    private final ModelMapper modelMapper;
    private final EmployeeAccountService employeeAccountService;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            ModelMapper modelMapper,
            EmployeeAccountService employeeAccountService) {

        this.employeeRepository = employeeRepository;
        this.modelMapper = modelMapper;
        this.employeeAccountService = employeeAccountService;
    }

    // CREATE EMPLOYEE + LOGIN ACCOUNT
    public EmployeeDTO createEmployee(EmployeeDTO employeeDTO) {

        if (employeeDTO == null) {
            throw new IllegalArgumentException(
                    "Employee details cannot be null");
        }

        if (employeeDTO.getEmail() == null ||
                employeeDTO.getEmail().isBlank()) {
            throw new IllegalArgumentException(
                    "Employee email is required");
        }

        logger.info(
                "Attempting to create employee: {}",
                employeeDTO.getEmployeeName());

        Employee employee = new Employee();

        employee.setEmployeeName(employeeDTO.getEmployeeName());

        String email = employeeDTO.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        employee.setEmail(email);
        employee.setDepartment(employeeDTO.getDepartment());
        employee.setJobTitle(employeeDTO.getJobTitle());
        employee.setSalary(employeeDTO.getSalary());
        employee.setPhone(employeeDTO.getPhone());
        employee.setLocation(employeeDTO.getLocation());
        employee.setActive(true);

        // Save employee record
        Employee savedEmployee = employeeRepository.save(employee);

        // Create disabled employee login account
        // and generate activation email
        employeeAccountService.createEmployeeAccount(
                savedEmployee.getEmail());

        logger.info(
                "Successfully created employee and activation account. ID: {}",
                savedEmployee.getId());

        return modelMapper.map(savedEmployee, EmployeeDTO.class);
    }

    // GET EMPLOYEE BY ID
    @Transactional(readOnly = true)
    public Employee getEmployeeById(Long id) {

        logger.info("Fetching employee details for ID: {}", id);

        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employee not found with ID: " + id));
    }

    // UPDATE EMPLOYEE
    public EmployeeDTO updateEmployee(
            Long id,
            EmployeeDTO employeeDTO) {

        if (employeeDTO == null) {
            throw new IllegalArgumentException(
                    "Employee details cannot be null");
        }

        Employee existingEmployee = getEmployeeById(id);

        if (!existingEmployee.isActive()) {
            throw new IllegalArgumentException(
                    "Cannot update a deactivated employee. Reactivate first.");
        }

        existingEmployee.setEmployeeName(employeeDTO.getEmployeeName());
        existingEmployee.setEmail(employeeDTO.getEmail());
        existingEmployee.setDepartment(employeeDTO.getDepartment());
        existingEmployee.setJobTitle(employeeDTO.getJobTitle());
        existingEmployee.setSalary(employeeDTO.getSalary());
        existingEmployee.setPhone(employeeDTO.getPhone());
        existingEmployee.setLocation(employeeDTO.getLocation());

        Employee savedEmployee =
                employeeRepository.save(existingEmployee);

        logger.info(
                "Successfully updated employee with ID: {}",
                savedEmployee.getId());

        return modelMapper.map(savedEmployee, EmployeeDTO.class);
    }

    // EXISTING PERMANENT DELETE METHOD
    public void deleteEmployee(Long id) {

        logger.info("Attempting to delete employee with ID: {}", id);

        Employee employee = getEmployeeById(id);
        employeeRepository.delete(employee);

        logger.info("Successfully deleted employee with ID: {}", id);
    }

    // DEACTIVATE EMPLOYEE
    public EmployeeDTO deactivateEmployee(Long id) {

        Employee employee = getEmployeeById(id);

        if (!employee.isActive()) {
            throw new IllegalArgumentException(
                    "Employee is already deactivated.");
        }

        employee.setActive(false);

        Employee savedEmployee =
                employeeRepository.save(employee);

        logger.info("Employee {} deactivated successfully.", id);

        return modelMapper.map(savedEmployee, EmployeeDTO.class);
    }

    // REACTIVATE EMPLOYEE
    public EmployeeDTO reactivateEmployee(Long id) {

        Employee employee = getEmployeeById(id);

        if (employee.isActive()) {
            throw new IllegalArgumentException(
                    "Employee is already active.");
        }

        employee.setActive(true);

        Employee savedEmployee =
                employeeRepository.save(employee);

        logger.info("Employee {} reactivated successfully.", id);

        return modelMapper.map(savedEmployee, EmployeeDTO.class);
    }

    // PAGINATED ACTIVE EMPLOYEES
    @Transactional(readOnly = true)
    public Page<EmployeeDTO> getEmployees(Pageable pageable) {

        Page<Employee> employeePage =
                employeeRepository.findByActiveTrue(pageable);

        return employeePage.map(
                employee -> modelMapper.map(
                        employee, EmployeeDTO.class));
    }

    // ACTIVE EMPLOYEES
    @Transactional(readOnly = true)
    public List<EmployeeDTO> getAllEmployees() {

        List<Employee> employees =
                employeeRepository.findByActiveTrue();

        return employees.stream()
                .map(employee -> modelMapper.map(
                        employee, EmployeeDTO.class))
                .toList();
    }

    // INACTIVE EMPLOYEES
    @Transactional(readOnly = true)
    public List<EmployeeDTO> getInactiveEmployees() {

        List<Employee> employees =
                employeeRepository.findByActiveFalse();

        return employees.stream()
                .map(employee -> modelMapper.map(
                        employee, EmployeeDTO.class))
                .toList();
    }

    // FILTER BY DEPARTMENT
    @Transactional(readOnly = true)
    public List<EmployeeDTO> filterByDepartment(String department) {

        List<Employee> employees =
                employeeRepository.findByDepartmentAndActiveTrue(department);

        if (employees.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No active employees found in department: " + department);
        }

        return employees.stream()
                .map(employee -> modelMapper.map(
                        employee, EmployeeDTO.class))
                .toList();
    }

    // SEARCH BY NAME
    @Transactional(readOnly = true)
    public List<EmployeeDTO> searchByName(String fullName) {

        List<Employee> employees =
                employeeRepository.findByEmployeeNameAndActiveTrue(fullName);

        if (employees.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No active employees found with the name: " + fullName);
        }

        return employees.stream()
                .map(employee -> modelMapper.map(
                        employee, EmployeeDTO.class))
                .toList();
    }

    // SEARCH BY JOB TITLE
    @Transactional(readOnly = true)
    public List<EmployeeDTO> searchByJobTitle(String jobTitle) {

        List<Employee> employees =
                employeeRepository.findByJobTitleAndActiveTrue(jobTitle);

        if (employees.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No active employees found with job title: " + jobTitle);
        }

        return employees.stream()
                .map(employee -> modelMapper.map(
                        employee, EmployeeDTO.class))
                .toList();
    }

    // GET EMPLOYEE PROFILE
    @Transactional(readOnly = true)
    public EmployeeDTO getEmployeeProfile(String email) {

        Employee employee = employeeRepository.findByEmail(
                email.trim().toLowerCase(Locale.ROOT)
        ).orElseThrow(() -> new ResourceNotFoundException(
                "Employee profile not found for email: " + email));

        return modelMapper.map(employee, EmployeeDTO.class);
    }

    // GET MY PROFILE
    @Transactional(readOnly = true)
    public EmployeeDTO getMyProfile(String email) {

        Employee employee = employeeRepository.findByEmail(
                email.trim().toLowerCase(Locale.ROOT)
        ).orElseThrow(() -> new ResourceNotFoundException(
                "Employee profile not found for: " + email));

        return modelMapper.map(employee, EmployeeDTO.class);
    }

    // UPDATE MY PROFILE
    public EmployeeDTO updateMyProfile(
            String email,
            EmployeeDTO employeeDTO) {

        if (employeeDTO == null) {
            throw new IllegalArgumentException(
                    "Profile details cannot be null");
        }

        Employee employee = employeeRepository.findByEmail(
                email.trim().toLowerCase(Locale.ROOT)
        ).orElseThrow(() -> new ResourceNotFoundException(
                "Employee profile not found for: " + email));

        employee.setEmployeeName(employeeDTO.getEmployeeName());
        employee.setPhone(employeeDTO.getPhone());
        employee.setLocation(employeeDTO.getLocation());

        Employee updatedEmployee =
                employeeRepository.save(employee);

        logger.info("Employee profile updated for: {}", email);

        return modelMapper.map(updatedEmployee, EmployeeDTO.class);
    }
}

