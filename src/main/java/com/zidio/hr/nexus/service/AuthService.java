package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.entity.Role;
import com.zidio.hr.nexus.enums.UserRole;
import com.zidio.hr.nexus.repository.UserRepository;
import com.zidio.hr.nexus.repository.RoleRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final AccountActivationService accountActivationService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            NotificationService notificationService,
            AccountActivationService accountActivationService) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
        this.accountActivationService = accountActivationService;
    }

    // ==========================================
    // USER REGISTRATION
    // ==========================================

    @Transactional
    public User register(
            User user,
            String confirmPassword,
            String requestedRole) {

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        if (!user.getPassword().equals(confirmPassword)) {
            throw new IllegalArgumentException(
                    "Password and confirm password do not match");
        }

        if (user.getPassword().length() < 8 ||
                user.getPassword().length() > 72) {
            throw new IllegalArgumentException(
                    "Password must be between 8 and 72 characters");
        }

        String email = user.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException(
                    "Email is already registered");
        }

        // SECURITY: Public registration always creates EMPLOYEE.
        // Never trust a role supplied by the frontend.
        UserRole userRole = UserRole.EMPLOYEE;

        Role role = roleRepository.findByName(userRole)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "EMPLOYEE role not found in database"));

        user.setEmail(email);

        user.setPassword(
                passwordEncoder.encode(user.getPassword()));

        Set<Role> roles = new HashSet<>();
        roles.add(role);

        user.setRoles(roles);

        // Account remains disabled until email activation.
        user.setEnabled(false);

        // New account must receive its welcome email after first login.
        user.setWelcomeEmailSent(false);

        // Save user
        User savedUser = userRepository.save(user);

        // Generate activation token and send activation email.
        accountActivationService.createActivationToken(savedUser);

        // Existing in-app welcome notification.
        notificationService.sendWelcomeNotification(
                savedUser.getEmail()
        );

        return savedUser;
    }

    // ==========================================
    // USER AUTHENTICATION
    // ==========================================

    @Transactional(readOnly = true)
    public boolean authenticate(String email, String password) {

        if (email == null || password == null) {
            return false;
        }

        User user = userRepository.findByEmail(
                email.trim().toLowerCase(Locale.ROOT)
        ).orElse(null);

        if (user == null || !user.isEnabled()) {
            return false;
        }

        return passwordEncoder.matches(
                password,
                user.getPassword());
    }

    // ==========================================
    // GET USER ROLE
    // ==========================================

    @Transactional(readOnly = true)
    public String getRoleByEmail(String email) {

        User user = userRepository.findByEmail(
                email.trim().toLowerCase(Locale.ROOT)
        ).orElseThrow(() ->
                new IllegalArgumentException("User not found"));

        return user.getRoles()
                .stream()
                .map(role -> role.getName().name())
                .findFirst()
                .orElseThrow(() ->
                        new IllegalStateException("No role assigned"));
    }

    // ==========================================
    // RESET PASSWORD
    // ==========================================

    @Transactional
    public void resetPassword(String email, String newPassword) {

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException(
                    "New password is required");
        }

        if (newPassword.length() < 8 ||
                newPassword.length() > 72) {
            throw new IllegalArgumentException(
                    "Password must be between 8 and 72 characters");
        }

        User user = userRepository.findByEmail(
                email.trim().toLowerCase(Locale.ROOT)
        ).orElseThrow(() ->
                new IllegalArgumentException("User not found"));

        user.setPassword(
                passwordEncoder.encode(newPassword));

        userRepository.save(user);

        // Existing security notification.
        notificationService.notifySecurityEvent(
                user.getEmail(),
                "Your account password has been changed successfully."
        );
    }

    // ==========================================
    // PASSWORD CHECK FOR TESTING
    // ==========================================

    public boolean checkPasswordForTesting(
            String email,
            String rawPassword) {

        User user = userRepository.findByEmail(
                email.trim().toLowerCase(Locale.ROOT)
        ).orElseThrow();

        return passwordEncoder.matches(
                rawPassword,
                user.getPassword()
        );
    }
}

