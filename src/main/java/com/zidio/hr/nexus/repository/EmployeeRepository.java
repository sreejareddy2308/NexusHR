package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    List<Employee> findByEmployeeName(String employeeName);

    List<Employee> findByDepartment(String department);

    List<Employee> findByJobTitle(String jobTitle);

    boolean existsByEmail(String email);

    Optional<Employee> findByEmail(String email);

    // Active employee queries
    List<Employee> findByActiveTrue();

    List<Employee> findByActiveFalse();

    Page<Employee> findByActiveTrue(Pageable pageable);

    Optional<Employee> findByEmailAndActiveTrue(String email);

    List<Employee> findByEmployeeNameAndActiveTrue(String employeeName);

    List<Employee> findByDepartmentAndActiveTrue(String department);

    List<Employee> findByJobTitleAndActiveTrue(String jobTitle);

    // AI insights analytics queries
    long countByActiveTrue();

    long countByActiveFalse();

}


