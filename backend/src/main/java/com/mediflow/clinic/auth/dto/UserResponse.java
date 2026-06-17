package com.mediflow.clinic.auth.dto;

import java.util.Set;
import java.util.UUID;

public record UserResponse(
	UUID id,
	String email,
	String fullName,
	String phoneNumber,
	Set<String> roles,
	Set<String> permissions
) {
}
