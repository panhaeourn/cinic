package com.mediflow.clinic.access.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserAccessResponse(
	UUID id,
	String email,
	String fullName,
	String phoneNumber,
	boolean enabled,
	boolean accountNonLocked,
	boolean credentialsNonExpired,
	List<String> roles,
	Instant createdAt,
	Instant updatedAt
) {
}
