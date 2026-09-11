package com.mediflow.clinic.patient.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.mediflow.clinic.patient.entity.Gender;

public record PatientListItemResponse(
	UUID id,
	String patientCode,
	String fullName,
	Gender gender,
	LocalDate dateOfBirth,
	String phone,
	String email,
	String bloodType,
	Instant createdAt
) {
}
