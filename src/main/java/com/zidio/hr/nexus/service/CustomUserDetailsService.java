package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.enums.UserRole;
import com.zidio.hr.nexus.repository.EmployeeRepository;
import com.zidio.hr.nexus.repository.UserRepository;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    public CustomUserDetailsService(
            UserRepository userRepository,
            EmployeeRepository employeeRepository) {

        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        String normalizedEmail =
                email.toLowerCase(Locale.ROOT).trim();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found with email: " + normalizedEmail
                        )
                );

        Set<SimpleGrantedAuthority> authorities =
                user.getRoles().stream()
                        .map(role -> {
                            String roleName =
                                    role.getName().name().toUpperCase(Locale.ROOT);

                            if (!roleName.startsWith("ROLE_")) {
                                roleName = "ROLE_" + roleName;
                            }

                            return new SimpleGrantedAuthority(roleName);
                        })
                        .collect(Collectors.toSet());

        // Check whether this account belongs to an employee.
        boolean isEmployee = user.getRoles().stream()
                .anyMatch(role ->
                        role.getName() == UserRole.EMPLOYEE
                );

        // Check current employment status directly from the database.
        boolean employeeActive = true;

        if (isEmployee) {
            employeeActive = employeeRepository
                    .findByEmailAndActiveTrue(normalizedEmail)
                    .isPresent();
        }

        // Account must be activated AND employment must be active.
        boolean accountEnabled =
                user.isEnabled() && employeeActive;

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities(authorities)
                .disabled(!accountEnabled)
                .build();
    }
}

