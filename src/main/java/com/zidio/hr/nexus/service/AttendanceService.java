package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.Attendance;
import com.zidio.hr.nexus.entity.Employee;
import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.entity.Role;

import com.zidio.hr.nexus.exception.ConflictException;
import com.zidio.hr.nexus.exception.ResourceNotFoundException;

import com.zidio.hr.nexus.repository.AttendanceRepository;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class AttendanceService {

    private static final Logger log =
            LoggerFactory.getLogger(AttendanceService.class);

    private final AttendanceRepository repository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final LocalTime SHIFT_START =
            LocalTime.of(9, 0);

    private static final LocalTime SHIFT_END =
            LocalTime.of(18, 0);

    private static final LocalTime BREAK_START =
            LocalTime.of(13, 0);

    private static final LocalTime BREAK_END =
            LocalTime.of(14, 0);

    private static final long STANDARD_WORK_MINUTES = 480;

    private static final long HALF_DAY_MINUTES = 240;

    public AttendanceService(
            AttendanceRepository repository,
            EmployeeRepository employeeRepository,
            UserRepository userRepository,
            NotificationService notificationService) {

        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ==========================================
    // EMPLOYEE CHECK-IN
    // ==========================================

    public Attendance checkIn(Long employeeId) {

        if (employeeId == null) {
            throw new IllegalArgumentException(
                    "Employee ID is required"
            );
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found"
                        )
                );

        LocalDate today = LocalDate.now();

        if (repository.findByEmployeeIdAndAttendanceDate(
                employeeId, today).isPresent()) {

            throw new ConflictException(
                    "Attendance already marked for today"
            );
        }

        Attendance attendance = new Attendance();

        attendance.setEmployeeId(employeeId);
        attendance.setAttendanceDate(today);
        attendance.setCheckIn(LocalTime.now());
        attendance.setStatus("PRESENT");

        Attendance saved = repository.save(attendance);

        // Notify employee
        notifyEmployee(
                employee,
                "Check-In Successful",
                "Your attendance check-in was recorded at "
                        + saved.getCheckIn(),
                "ATTENDANCE_CHECK_IN"
        );

        // Notify HR about late arrival
        if (saved.getCheckIn().isAfter(SHIFT_START)) {

            notifyHR(
                    "Late Arrival Alert",
                    employee.getEmployeeName()
                            + " checked in late at "
                            + saved.getCheckIn(),
                    "LATE_ARRIVAL"
            );
        }

        return enrichAttendance(saved);
    }

    // ==========================================
    // EMPLOYEE CHECK-OUT
    // ==========================================

    public Attendance checkOut(Long employeeId) {

        if (employeeId == null) {
            throw new IllegalArgumentException(
                    "Employee ID is required"
            );
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found"
                        )
                );

        Attendance attendance = repository
                .findByEmployeeIdAndAttendanceDate(
                        employeeId, LocalDate.now()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Check-in record not found for today"
                        )
                );

        if (attendance.getCheckOut() != null) {
            throw new ConflictException(
                    "Check-out already completed"
            );
        }

        LocalTime checkOutTime = LocalTime.now();

        if (!checkOutTime.isAfter(attendance.getCheckIn())) {
            throw new ConflictException(
                    "Check-out must be after check-in"
            );
        }

        attendance.setCheckOut(checkOutTime);

        calculateAttendance(attendance);

        Attendance saved = repository.save(attendance);

        // Notify employee
        notifyEmployee(
                employee,
                "Check-Out Successful",
                "Your attendance check-out was recorded at "
                        + saved.getCheckOut()
                        + ". Working minutes: "
                        + saved.getWorkingMinutes(),
                "ATTENDANCE_CHECK_OUT"
        );

        // Notify HR about early departure
        if (saved.isEarlyDeparture()) {

            notifyHR(
                    "Early Departure Alert",
                    employee.getEmployeeName()
                            + " checked out early at "
                            + saved.getCheckOut(),
                    "EARLY_DEPARTURE"
            );
        }

        return saved;
    }

    // ==========================================
    // CALCULATE ATTENDANCE INFORMATION
    // ==========================================

    private void calculateAttendance(Attendance attendance) {

        LocalTime checkIn = attendance.getCheckIn();
        LocalTime checkOut = attendance.getCheckOut();

        long grossMinutes = Duration.between(
                checkIn, checkOut
        ).toMinutes();

        // Deduct only the overlap with scheduled lunch break
        LocalTime overlapStart =
                checkIn.isAfter(BREAK_START)
                        ? checkIn : BREAK_START;

        LocalTime overlapEnd =
                checkOut.isBefore(BREAK_END)
                        ? checkOut : BREAK_END;

        long breakMinutes = 0;

        if (overlapEnd.isAfter(overlapStart)) {
            breakMinutes = Duration.between(
                    overlapStart, overlapEnd
            ).toMinutes();
        }

        long workingMinutes = grossMinutes - breakMinutes;

        long overtimeMinutes = Math.max(
                0, workingMinutes - STANDARD_WORK_MINUTES
        );

        attendance.setWorkingMinutes(workingMinutes);
        attendance.setOvertimeMinutes(overtimeMinutes);

        attendance.setLateArrival(
                checkIn.isAfter(SHIFT_START)
        );

        attendance.setEarlyDeparture(
                checkOut.isBefore(SHIFT_END)
        );

        if (workingMinutes < HALF_DAY_MINUTES) {
            attendance.setStatus("HALF_DAY");
        } else {
            attendance.setStatus("PRESENT");
        }
    }

    // ==========================================
    // ENRICH ATTENDANCE RESPONSE
    // ==========================================

    private Attendance enrichAttendance(Attendance attendance) {

        if (attendance.getCheckIn() != null) {

            attendance.setLateArrival(
                    attendance.getCheckIn().isAfter(SHIFT_START)
            );
        }

        if (attendance.getCheckOut() != null) {

            calculateAttendance(attendance);

        } else {
            attendance.setWorkingMinutes(null);
            attendance.setOvertimeMinutes(null);
        }

        return attendance;
    }

    // ==========================================
    // NOTIFY EMPLOYEE
    // ==========================================

    private void notifyEmployee(
            Employee employee,
            String title,
            String message,
            String type) {

        try {

            notificationService.createNotification(
                    employee.getEmail(),
                    title,
                    message,
                    type
            );

        } catch (Exception exception) {

            log.error(
                    "Employee attendance notification failed",
                    exception
            );
        }
    }

    // ==========================================
    // NOTIFY ADMIN AND HR MANAGER
    // ==========================================

    private void notifyHR(
            String title,
            String message,
            String type) {

        try {

            Set<String> recipientEmails = userRepository.findAll()
                    .stream()
                    .filter(user -> user.getRoles() != null)
                    .filter(user -> user.getRoles().stream()
                            .map(Role::getName)
                            .anyMatch(role ->
                                    "ADMIN".equals(role)
                                            || "HR_MANAGER".equals(role)
                            )
                    )
                    .map(User::getEmail)
                    .filter(email ->
                            email != null && !email.isBlank()
                    )
                    .collect(Collectors.toSet());

            for (String email : recipientEmails) {

                notificationService.createNotification(
                        email,
                        title,
                        message,
                        type
                );
            }

        } catch (Exception exception) {

            log.error(
                    "HR attendance notification failed",
                    exception
            );
        }
    }

    // ==========================================
    // GET ALL ATTENDANCE
    // ==========================================

    @Transactional(readOnly = true)
    public List<Attendance> getAllAttendance() {

        return repository.findAll()
                .stream()
                .map(this::enrichAttendance)
                .toList();
    }

    // ==========================================
    // GET EMPLOYEE ATTENDANCE
    // ==========================================

    @Transactional(readOnly = true)
    public List<Attendance> getEmployeeAttendance(
            Long employeeId) {

        return repository.findByEmployeeId(employeeId)
                .stream()
                .map(this::enrichAttendance)
                .toList();
    }

    // ==========================================
    // GET ATTENDANCE BY DATE
    // ==========================================

    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceByDate(
            LocalDate date) {

        return repository.findByAttendanceDate(date)
                .stream()
                .map(this::enrichAttendance)
                .toList();
    }
}

