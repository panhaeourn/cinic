package com.mediflow.clinic.staff.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record StaffClaimGenerateRequest(
	@NotNull(message = "Staff ID is required.")
	UUID staffId
) {
}
