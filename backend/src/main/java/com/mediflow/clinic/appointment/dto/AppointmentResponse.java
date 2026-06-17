package com.mediflow.clinic.appointment.dto;

import java.time.Instant;
import java.util.UUID;

import com.mediflow.clinic.appointment.entity.AppointmentStatus;

public record AppointmentResponse(
	UUID id,
	UUID patientId,
	String patientCode,
	String patientName,
	UUID doctorId,
	String doctorName,
	Instant scheduledAt,
	Integer durationMinutes,
	AppointmentStatus status,
	String reason,
	String notes,
	Instant createdAt,
	Instant updatedAt
) {
}
