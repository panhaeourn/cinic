package com.mediflow.clinic.staff.dto;

import java.time.Instant;
import java.util.UUID;

import com.mediflow.clinic.patient.entity.Gender;
import com.mediflow.clinic.staff.entity.StaffStatus;
import com.mediflow.clinic.staff.entity.StaffType;

public record StaffResponse(
	UUID id,
	String staffCode,
	UUID userId,
	String firstName,
	String lastName,
	String fullName,
	Gender gender,
	String phone,
	String email,
	StaffType staffType,
	String roleName,
	UUID departmentId,
	String departmentName,
	StaffStatus status,
	Instant createdAt,
	Instant updatedAt
) {
}
