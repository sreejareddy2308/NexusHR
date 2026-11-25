package com.zidio.hr.nexus.service;

import com.zidio.hr.nexus.entity.User;
import com.zidio.hr.nexus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WelcomeEmailService {

    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public void sendWelcomeEmailOnce(Long userId) {

        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if (user.isWelcomeEmailSent()) {
            return;
        }

        emailService.sendWelcomeEmail(user.getEmail());

        user.setWelcomeEmailSent(true);
        userRepository.save(user);
    }
}

