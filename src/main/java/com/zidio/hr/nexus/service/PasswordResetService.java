
package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.entity.PasswordResetToken;
import com.zidio.hr.nexus.repository.UserRepository;
import com.zidio.hr.nexus.repository.PasswordResetTokenRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;

@Service
@Transactional
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            JavaMailSender mailSender) {

        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    // Generate or replace the user's password reset token
    public void generateResetToken(User user) {

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String token = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        PasswordResetToken resetToken = tokenRepository
                .findByUser_Id(user.getId())
                .orElseGet(PasswordResetToken::new);

        resetToken.setUser(user);
        resetToken.setEmail(user.getEmail());
        resetToken.setToken(token);
        resetToken.setExpiryDate(
                LocalDateTime.now().plusMinutes(15)
        );
        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        sendResetEmail(user.getEmail(), token);
    }

    // Forgot password
    public void forgotPassword(String email) {

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        generateResetToken(user);
    }

    // Send password reset email
    private void sendResetEmail(String email, String token) {

        String baseUrl = frontendUrl.replaceAll("/+$", "");

        String resetLink = baseUrl
                + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject("NexusHR - Password Reset Request");

        message.setText(
                "Hello,\n\n"
                        + "We received a request to reset your NexusHR password.\n\n"
                        + "Click the link below to reset your password:\n\n"
                        + resetLink + "\n\n"
                        + "This link expires in 15 minutes.\n\n"
                        + "If you did not request this password reset, "
                        + "please ignore this email.\n\n"
                        + "Regards,\n"
                        + "NexusHR Security Team"
        );

        mailSender.send(message);
    }

    // Reset password
    public void resetPassword(
            String token,
            String newPassword) {

        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException(
                    "Reset token is required"
            );
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException(
                    "Password must contain at least 8 characters"
            );
        }

        PasswordResetToken resetToken = tokenRepository
                .findByToken(token.trim())
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid reset token")
                );

        if (resetToken.isUsed()) {
            throw new IllegalStateException(
                    "Password reset token has already been used"
            );
        }

        if (resetToken.getExpiryDate() == null
                || !resetToken.getExpiryDate().isAfter(LocalDateTime.now())) {

            throw new IllegalArgumentException(
                    "Password reset token has expired"
            );
        }

        User user = resetToken.getUser();

        if (user == null) {
            throw new IllegalArgumentException(
                    "Invalid password reset request"
            );
        }

        // Encode the new password using BCrypt
        user.setPassword(passwordEncoder.encode(newPassword));

        userRepository.save(user);

        // Mark token as used after password update
        resetToken.setUsed(true);

        tokenRepository.save(resetToken);
    }
}

