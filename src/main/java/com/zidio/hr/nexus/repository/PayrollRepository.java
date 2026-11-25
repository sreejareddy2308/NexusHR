package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {

    List<Payroll> findByEmployeeId(Long employeeId);

    boolean existsByEmployeeIdAndMonth(Long employeeId, String month);

    List<Payroll> findByStatus(String status);

    List<Payroll> findByMonth(String month);
}


