package com.zidio.hr.nexus.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    // Reusable email method
    public void sendEmail(
            String recipient,
            String subject,
            String content
    ) {

        if (recipient == null || recipient.isBlank()) {
            throw new IllegalArgumentException(
                    "Recipient email is required"
            );
        }

        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException(
                    "Email subject is required"
            );
        }

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException(
                    "Email content is required"
            );
        }

        SimpleMailMessage message = new SimpleMailMessage();

        if (senderEmail != null && !senderEmail.isBlank()) {
            message.setFrom(senderEmail);
        }

        message.setTo(recipient.trim());
        message.setSubject(subject);
        message.setText(content);

        mailSender.send(message);
    }

    // Existing welcome email functionality preserved
    public void sendWelcomeEmail(String employeeEmail) {

        String subject = "Welcome to NexusHR!";

        String content =
                "Hello,\n\n" +
                        "Welcome to NexusHR!\n\n" +
                        "Your employee account is now active. " +
                        "You can log in and explore your employee dashboard.\n\n" +
                        "We are happy to have you with us.\n\n" +
                        "Regards,\n" +
                        "NexusHR Team";

        sendEmail(employeeEmail, subject, content);
    }
}

