package com.mediflow.clinic.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
	@NotBlank(message = "Full name is required")
	@Size(max = 120, message = "Full name must be 120 characters or fewer")
	String fullName,

	@NotBlank(message = "Email is required")
	@Email(message = "Email must be valid")
	@Size(max = 180, message = "Email must be 180 characters or fewer")
	String email,

	@NotBlank(message = "Password is required")
	@Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
	@Pattern(
		regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$",
		message = "Password must include uppercase, lowercase, number, and special character"
	)
	String password,

	@Size(max = 40, message = "Phone number must be 40 characters or fewer")
	String phoneNumber
) {
}
