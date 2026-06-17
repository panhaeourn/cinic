package com.mediflow.clinic.common.code;

import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

public interface CodeSequenceRepository extends JpaRepository<CodeSequence, UUID> {

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<CodeSequence> findByCodeTypeAndSequenceYear(String codeType, int sequenceYear);
}
