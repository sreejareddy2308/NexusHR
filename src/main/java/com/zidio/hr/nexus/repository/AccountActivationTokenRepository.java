package com.zidio.hr.nexus.repository;

import com.zidio.hr.nexus.entity.AccountActivationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface AccountActivationTokenRepository
        extends JpaRepository<AccountActivationToken, Long> {

    Optional<AccountActivationToken> findByToken(String token);

    void deleteByUser_Id(Long userId);
}


