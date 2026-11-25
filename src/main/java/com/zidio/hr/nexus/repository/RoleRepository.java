package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.Role;
import com.zidio.hr.nexus.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(UserRole name);
}

