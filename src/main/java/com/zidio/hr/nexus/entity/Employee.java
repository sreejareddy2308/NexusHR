package com.zidio.hr.nexus.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import java.time.LocalDate;

import java.io.Serializable;

@Entity
@Table(name = "employees")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Employee implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Full name is required")
    @Column(name = "emp_name", nullable = false)
    private String employeeName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Column(unique = true, nullable = false)
    private String email;

    private String department;

    @Column(name = "job_title")
    private String jobTitle;

    @PositiveOrZero(message = "Salary cannot be negative")
    private Double salary;

    @Column(name = "phone")
    private String phone;

    @Column(name = "location")
    private String location;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "active", nullable = false)
    private boolean active = true;
}






