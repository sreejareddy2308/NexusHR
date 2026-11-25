package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.AccountActivationToken;
import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.repository.AccountActivationTokenRepository;
import com.zidio.hr.nexus.repository.UserRepository;

import jakarta.transaction.Transactional;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AccountActivationService {

    private final AccountActivationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Transactional
    public void createActivationToken(User user) {

        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException(
                    "A saved user account is required"
            );
        }

        if (user.isEnabled()) {
            throw new IllegalStateException(
                    "Account is already activated"
            );
        }

        // Invalidate any previously issued activation link.
        tokenRepository.deleteByUser_Id(user.getId());

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        AccountActivationToken activationToken =
                new AccountActivationToken();

        activationToken.setUser(user);
        activationToken.setEmail(user.getEmail());
        activationToken.setToken(rawToken);
        activationToken.setExpiryDate(
                LocalDateTime.now().plusHours(24)
        );
        activationToken.setUsed(false);

        tokenRepository.save(activationToken);

        sendActivationEmail(user.getEmail(), rawToken);
    }

    private void sendActivationEmail(String email, String token) {

        String activationLink =
                frontendUrl + "/activate-account?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject("NexusHR - Activate Your Employee Account");

        message.setText(
                "Welcome to NexusHR!\n\n" +
                        "Your employee account has been created.\n\n" +
                        "Click the link below to activate your account " +
                        "and create your password:\n\n" +
                        activationLink + "\n\n" +
                        "This activation link expires in 24 hours.\n\n" +
                        "If you did not expect this email, please contact HR."
        );

        mailSender.send(message);
    }

    @Transactional
    public void activateAccount(String token, String newPassword) {

        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException(
                    "Activation token is required"
            );
        }

        if (newPassword == null ||
                newPassword.length() < 8 ||
                newPassword.length() > 72) {

            throw new IllegalArgumentException(
                    "Password must contain between 8 and 72 characters"
            );
        }

        AccountActivationToken activationToken =
                tokenRepository.findByToken(token)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid activation link"
                                )
                        );

        if (activationToken.isUsed()) {
            throw new IllegalArgumentException(
                    "This activation link has already been used"
            );
        }

        if (activationToken.getExpiryDate()
                .isBefore(LocalDateTime.now())) {

            throw new IllegalArgumentException(
                    "Activation link has expired. Please contact HR."
            );
        }

        User user = activationToken.getUser();

        if (user.isEnabled()) {
            throw new IllegalStateException(
                    "This account is already activated"
            );
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setEnabled(true);

        userRepository.save(user);

        activationToken.setUsed(true);
        tokenRepository.save(activationToken);
    }

    @Transactional
    public void resendActivationEmail(String email) {

        User user = userRepository.findByEmailIgnoreCase(
                email.trim().toLowerCase(Locale.ROOT)
        ).orElseThrow(() ->
                new IllegalArgumentException("Account not found")
        );

        if (user.isEnabled()) {
            throw new IllegalArgumentException(
                    "Account is already activated"
            );
        }

        createActivationToken(user);
    }
}