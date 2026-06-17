package com.mediflow.clinic.appointment.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.mediflow.clinic.appointment.entity.AppointmentStatus;

public record AppointmentUpdateRequest(
	@NotNull UUID patientId,
	UUID doctorId,
	@NotNull Instant scheduledAt,
	@Min(5) @Max(480) Integer durationMinutes,
	@NotNull AppointmentStatus status,
	@Size(max = 180) String reason,
	String notes
) {
}
