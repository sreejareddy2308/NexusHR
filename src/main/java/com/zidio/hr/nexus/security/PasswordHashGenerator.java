package com.zidio.hr.nexus.security;

import java.io.Console;
import java.util.Arrays;
import java.util.Scanner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        Console console = System.console();
        char[] password;

        if (console != null) {
            password = console.readPassword("New password: ");
        } else {
            System.out.print("New password (local console): ");
            password = new Scanner(System.in).nextLine().toCharArray();
        }

        try {
            String hash = new BCryptPasswordEncoder()
                    .encode(new String(password));
            System.out.println("BCrypt hash: " + hash);
        } finally {
            Arrays.fill(password, '\0');
        }
    }
}
