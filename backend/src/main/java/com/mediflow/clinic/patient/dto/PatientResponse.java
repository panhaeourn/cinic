package com.mediflow.clinic.patient.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.mediflow.clinic.patient.entity.Gender;

public record PatientResponse(
	UUID id,
	String patientCode,
	UUID userId,
	String firstName,
	String lastName,
	String fullName,
	String khmerName,
	Gender gender,
	LocalDate dateOfBirth,
	String phone,
	String email,
	String address,
	String bloodType,
	String allergies,
	String emergencyContactName,
	String emergencyContactPhone,
	Instant createdAt,
	Instant updatedAt
) {
}
