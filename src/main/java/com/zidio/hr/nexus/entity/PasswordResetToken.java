package com.zidio.hr.nexus.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
@Setter
@Getter
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String token;
    @Column(nullable = false)
    private String email;
    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;
    @Column(nullable = false)
    private boolean used = false;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    // Default constructor
    public PasswordResetToken() {
    }
    public PasswordResetToken(
            String token,
            String email,
            LocalDateTime expiryDate) {
        this.token = token;
        this.email = email;
        this.expiryDate = expiryDate;
        this.used = false;
    }

    // Getters and Setters

}