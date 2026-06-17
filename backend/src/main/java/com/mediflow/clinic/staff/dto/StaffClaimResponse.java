package com.mediflow.clinic.staff.dto;

import java.time.Instant;
import java.util.UUID;

public record StaffClaimResponse(
	UUID id,
	UUID staffId,
	String staffCode,
	String staffName,
	String claimCode,
	String targetEmail,
	String roleName,
	Instant createdAt,
	Instant expiresAt,
	boolean used,
	Instant usedAt,
	String status
) {
}
