package com.mediflow.clinic.access.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PasswordResetRequest(
	@NotBlank(message = "Temporary password is required")
	@Size(min = 8, max = 72, message = "Temporary password must be between 8 and 72 characters")
	@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Temporary password must contain at least one letter and one number")
	String temporaryPassword
) {
}
