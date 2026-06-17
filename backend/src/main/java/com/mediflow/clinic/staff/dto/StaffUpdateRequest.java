package com.mediflow.clinic.staff.dto;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.mediflow.clinic.patient.entity.Gender;
import com.mediflow.clinic.staff.entity.StaffStatus;
import com.mediflow.clinic.staff.entity.StaffType;

public record StaffUpdateRequest(
	UUID userId,

	@NotBlank(message = "First name is required.")
	@Size(max = 80, message = "First name must be 80 characters or fewer.")
	String firstName,

	@NotBlank(message = "Last name is required.")
	@Size(max = 80, message = "Last name must be 80 characters or fewer.")
	String lastName,

	@NotNull(message = "Gender is required.")
	Gender gender,

	@NotBlank(message = "Phone number is required.")
	@Size(max = 40, message = "Phone number must be 40 characters or fewer.")
	String phone,

	@NotBlank(message = "Email is required.")
	@Email(message = "Email must be valid.")
	@Size(max = 180, message = "Email must be 180 characters or fewer.")
	String email,

	@NotNull(message = "Staff type is required.")
	StaffType staffType,

	@Size(max = 50, message = "Role name must be 50 characters or fewer.")
	String roleName,

	UUID departmentId,

	@NotNull(message = "Status is required.")
	StaffStatus status
) {
}
