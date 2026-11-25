
package com.zidio.hr.nexus;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthServiceTest {

    @Test
    void shouldMatchPasswordWithStoredHash() {

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String rawPassword = "NexusTest@123";
        String storedHash = encoder.encode(rawPassword);

        boolean matches = encoder.matches(rawPassword, storedHash);

        System.out.println("BCrypt password match: " + matches);

        assertTrue(matches, "BCrypt password matching failed");
    }
}
