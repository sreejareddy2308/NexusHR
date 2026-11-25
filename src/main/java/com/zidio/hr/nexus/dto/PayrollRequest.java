package com.zidio.hr.nexus.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class PayrollRequest {

    @NotNull
    @Positive
    private Long employeeId;

    @NotBlank
    private String month;

    @NotNull
    @PositiveOrZero
    private BigDecimal basicSalary;

    @NotNull
    @PositiveOrZero
    private BigDecimal hra;

    @NotNull
    @PositiveOrZero
    private BigDecimal allowances;

    @NotNull
    @PositiveOrZero
    private BigDecimal pf;

    @NotNull
    @PositiveOrZero
    private BigDecimal tax;

    @NotNull
    @PositiveOrZero
    private BigDecimal deductions;

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public BigDecimal getBasicSalary() {
        return basicSalary;
    }

    public void setBasicSalary(BigDecimal basicSalary) {
        this.basicSalary = basicSalary;
    }

    public BigDecimal getHra() {
        return hra;
    }

    public void setHra(BigDecimal hra) {
        this.hra = hra;
    }

    public BigDecimal getAllowances() {
        return allowances;
    }

    public void setAllowances(BigDecimal allowances) {
        this.allowances = allowances;
    }

    public BigDecimal getPf() {
        return pf;
    }

    public void setPf(BigDecimal pf) {
        this.pf = pf;
    }

    public BigDecimal getTax() {
        return tax;
    }

    public void setTax(BigDecimal tax) {
        this.tax = tax;
    }

    public BigDecimal getDeductions() {
        return deductions;
    }

    public void setDeductions(BigDecimal deductions) {
        this.deductions = deductions;
    }
}

