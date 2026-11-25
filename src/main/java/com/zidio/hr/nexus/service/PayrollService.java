package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.dto.PayrollRequest;
import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.entity.Payroll;
import com.zidio.hr.nexus.exception.ResourceNotFoundException;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.repository.PayrollRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;

    public PayrollService(
            PayrollRepository payrollRepository,
            EmployeeRepository employeeRepository,
            NotificationService notificationService) {

        this.payrollRepository = payrollRepository;
        this.employeeRepository = employeeRepository;
        this.notificationService = notificationService;
    }

    // ==========================================
    // GENERATE PAYROLL + NOTIFY EMPLOYEE
    // ==========================================

    public Payroll generatePayroll(PayrollRequest request) {

        // Verify employee exists
        Employee employee = employeeRepository.findById(
                request.getEmployeeId()
        ).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Employee not found: " + request.getEmployeeId()
                ));

        // Prevent duplicate payroll for the same month
        if (payrollRepository.existsByEmployeeIdAndMonth(
                request.getEmployeeId(),
                request.getMonth())) {

            throw new IllegalArgumentException(
                    "Payroll already exists for this employee and month"
            );
        }

        // Calculate gross salary
        BigDecimal grossSalary = request.getBasicSalary()
                .add(request.getHra())
                .add(request.getAllowances());

        // Calculate total deductions
        BigDecimal totalDeductions = request.getPf()
                .add(request.getTax())
                .add(request.getDeductions());

        if (totalDeductions.compareTo(grossSalary) > 0) {
            throw new IllegalArgumentException(
                    "Deductions cannot exceed gross salary"
            );
        }

        // Calculate net salary
        BigDecimal netSalary = grossSalary.subtract(totalDeductions);

        // Create payroll record
        Payroll payroll = new Payroll();

        payroll.setEmployeeId(employee.getId());
        payroll.setEmployeeName(employee.getEmployeeName());
        payroll.setMonth(request.getMonth());

        payroll.setBasicSalary(request.getBasicSalary());
        payroll.setHra(request.getHra());
        payroll.setAllowances(request.getAllowances());

        payroll.setPf(request.getPf());
        payroll.setTax(request.getTax());
        payroll.setDeductions(request.getDeductions());

        payroll.setGrossSalary(grossSalary);
        payroll.setNetSalary(netSalary);

        payroll.setPaymentDate(LocalDate.now());
        payroll.setStatus("GENERATED");

        // Save payroll
        Payroll savedPayroll = payrollRepository.save(payroll);

        // Send notification to employee
        if (employee.getEmail() != null &&
                !employee.getEmail().isBlank()) {

            try {
                notificationService.notifyPayslipGenerated(
                        employee.getEmail(),
                        request.getMonth()
                );
            } catch (Exception e) {
                // Notification failure should not block payroll generation
            }
        }

        return savedPayroll;
    }

    // ==========================================
    // GET ALL PAYROLLS
    // ==========================================

    @Transactional(readOnly = true)
    public List<Payroll> getAllPayrolls() {
        return payrollRepository.findAll();
    }

    // ==========================================
    // GET PAYROLL BY ID
    // ==========================================

    @Transactional(readOnly = true)
    public Payroll getPayrollById(Long id) {
        return payrollRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Payroll not found: " + id
                        ));
    }

    // ==========================================
    // GET PAYROLL BY EMPLOYEE
    // ==========================================

    @Transactional(readOnly = true)
    public List<Payroll> getPayrollByEmployee(Long employeeId) {
        return payrollRepository.findByEmployeeId(employeeId);
    }

    // ==========================================
    // GET PAYROLL BY MONTH
    // ==========================================

    @Transactional(readOnly = true)
    public List<Payroll> getPayrollByMonth(String month) {
        return payrollRepository.findByMonth(month);
    }

    // ==========================================
    // DELETE PAYROLL
    // ==========================================

    public void deletePayroll(Long id) {

        if (!payrollRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Payroll not found: " + id
            );
        }

        payrollRepository.deleteById(id);
    }

    // ==========================================
    // MARK PAYROLL AS PAID
    // ==========================================

    public Payroll markPayrollAsPaid(Long id) {

        Payroll payroll = payrollRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Payroll not found: " + id
                        )
                );

        if ("PAID".equalsIgnoreCase(payroll.getStatus())) {
            throw new IllegalStateException(
                    "Payroll has already been marked as PAID"
            );
        }

        payroll.setStatus("PAID");
        payroll.setPaymentDate(LocalDate.now());

        return payrollRepository.save(payroll);
    }
}

