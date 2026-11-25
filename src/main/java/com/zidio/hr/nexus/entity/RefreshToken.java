package com.zidio.hr.nexus.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.zidio.hr.nexus.entity.User;
import java.time.LocalDateTime;
@Getter
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Setter
    @Column(nullable = false, unique = true)
    private String token;
    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Setter
    @Column(nullable = false)
    private LocalDateTime expiryDate;
    @Setter
    @Column(nullable = false)
    private boolean revoked = false;
    public RefreshToken() {
    }
}
