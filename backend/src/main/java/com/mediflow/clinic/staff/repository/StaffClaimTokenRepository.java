package com.mediflow.clinic.staff.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mediflow.clinic.staff.entity.StaffClaimToken;

public interface StaffClaimTokenRepository extends JpaRepository<StaffClaimToken, UUID> {

	Optional<StaffClaimToken> findByClaimCodeIgnoreCase(String claimCode);

	Optional<StaffClaimToken> findTopByStaffIdOrderByCreatedAtDesc(UUID staffId);

	List<StaffClaimToken> findByStaffIdAndUsedFalse(UUID staffId);

	boolean existsByClaimCodeIgnoreCase(String claimCode);
}
