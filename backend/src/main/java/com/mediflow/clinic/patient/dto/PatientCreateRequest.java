package com.mediflow.clinic.patient.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import com.mediflow.clinic.patient.entity.Gender;

public record PatientCreateRequest(
	UUID userId,

	@NotBlank(message = "First name is required.")
	@Size(max = 80, message = "First name must be 80 characters or fewer.")
	String firstName,

	@NotBlank(message = "Last name is required.")
	@Size(max = 80, message = "Last name must be 80 characters or fewer.")
	String lastName,

	@Size(max = 160, message = "Khmer name must be 160 characters or fewer.")
	String khmerName,

	@NotNull(message = "Gender is required.")
	Gender gender,

	@NotNull(message = "Date of birth is required.")
	@Past(message = "Date of birth must be in the past.")
	LocalDate dateOfBirth,

	@NotBlank(message = "Phone number is required.")
	@Size(max = 40, message = "Phone number must be 40 characters or fewer.")
	String phone,

	@Email(message = "Email must be valid.")
	@Size(max = 180, message = "Email must be 180 characters or fewer.")
	String email,

	@NotBlank(message = "Address is required.")
	String address,

	@Size(max = 12, message = "Blood type must be 12 characters or fewer.")
	String bloodType,

	String allergies,

	@Size(max = 120, message = "Emergency contact name must be 120 characters or fewer.")
	String emergencyContactName,

	@Size(max = 40, message = "Emergency contact phone must be 40 characters or fewer.")
	String emergencyContactPhone
) {
}
