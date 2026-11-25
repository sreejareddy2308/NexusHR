package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.Role;
import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.enums.UserRole;
import com.zidio.hr.nexus.repository.RoleRepository;
import com.zidio.hr.nexus.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployeeAccountService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountActivationService accountActivationService;

    @Transactional
    public void createEmployeeAccount(String employeeEmail) {

        if (employeeEmail == null || employeeEmail.isBlank()) {
            throw new IllegalArgumentException("Employee email is required");
        }

        String email = employeeEmail.trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException(
                    "An account already exists with this email"
            );
        }

        Role employeeRole = roleRepository.findByName(UserRole.EMPLOYEE)
                .orElseThrow(() -> new IllegalStateException(
                        "EMPLOYEE role not found in database"
                ));

        User user = new User();
        user.setEmail(email);

        // Temporary password: employee must set their own password
        // through the activation link.
        user.setPassword(
                passwordEncoder.encode(UUID.randomUUID().toString())
        );

        user.setEnabled(false);
        user.setRoles(new HashSet<>());
        user.getRoles().add(employeeRole);

        User savedUser = userRepository.save(user);

        accountActivationService.createActivationToken(savedUser);
    }
}

