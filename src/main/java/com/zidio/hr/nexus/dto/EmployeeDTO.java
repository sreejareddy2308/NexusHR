package com.zidio.hr.nexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDTO implements Serializable {
    private Long id;
    private String employeeName;
    private String email;
    private String department;
    private String jobTitle;
    private Double salary;
    private String phone;
    private String location;
}

