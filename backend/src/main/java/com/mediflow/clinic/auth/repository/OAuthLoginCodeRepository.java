package com.mediflow.clinic.auth.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mediflow.clinic.auth.entity.OAuthLoginCode;

public interface OAuthLoginCodeRepository extends JpaRepository<OAuthLoginCode, UUID> {

	Optional<OAuthLoginCode> findByCodeHash(String codeHash);
}
