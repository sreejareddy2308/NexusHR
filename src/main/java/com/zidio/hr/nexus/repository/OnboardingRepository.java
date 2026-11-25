package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.Onboarding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OnboardingRepository
        extends JpaRepository<Onboarding, Long> {

    Optional<Onboarding> findByEmployee_Id(Long employeeId);

    boolean existsByEmployee_Id(Long employeeId);
}


