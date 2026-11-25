package com.zidio.hr.nexus;

import com.zidio.hr.nexus.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
public class AdminPasswordResetTest {

    @Autowired
    private AuthService authService;

    @Test
    @EnabledIfSystemProperty(
            named = "runAdminPasswordResetTest",
            matches = "true"
    )
    void resetAdminPassword() {

        String email = "admin.test@example.com";
        String newPassword = System.getenv("ADMIN_TEST_NEW_PASSWORD");

        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalStateException(
                    "Set ADMIN_TEST_NEW_PASSWORD before running this test"
            );
        }

        assertEquals("ADMIN", authService.getRoleByEmail(email));

        authService.resetPassword(email, newPassword);

        assertTrue(authService.authenticate(email, newPassword));
        assertEquals("ADMIN", authService.getRoleByEmail(email));
    }
}

