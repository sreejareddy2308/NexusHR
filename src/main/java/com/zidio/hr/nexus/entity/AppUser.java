package com.zidio.hr.nexus.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Setter
@Getter
@Entity
@Table(
        name = "app_users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "email")
        }
)
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Email
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank
    @Column(nullable = false)
    private String password;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id")
    )
    @Column(name = "role_name", nullable = false)
    private Set<String> roles = new HashSet<>();

    public AppUser() {
    }

    public AppUser(String email, String password) {
        this.email = email;
        this.password = password;
        this.roles.add("EMPLOYEE");
    }

}
