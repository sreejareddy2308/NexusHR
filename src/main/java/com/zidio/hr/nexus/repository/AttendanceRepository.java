package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    List<Attendance> findByEmployeeId(Long employeeId);

    List<Attendance> findByAttendanceDate(LocalDate date);

    Optional<Attendance> findByEmployeeIdAndAttendanceDate(
            Long employeeId, LocalDate date);

    // AI insights analytics query
    List<Attendance> findByAttendanceDateBetween(
            LocalDate startDate,
            LocalDate endDate
    );
}