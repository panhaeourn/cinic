package com.mediflow.clinic.staff.dto;

import jakarta.validation.constraints.NotBlank;

public record StaffClaimRequest(
	@NotBlank(message = "Claim code is required.")
	String code
) {
}
