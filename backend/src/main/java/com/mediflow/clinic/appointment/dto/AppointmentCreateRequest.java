package com.mediflow.clinic.appointment.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AppointmentCreateRequest(
	@NotNull UUID patientId,
	UUID doctorId,
	@NotNull Instant scheduledAt,
	@Min(5) @Max(480) Integer durationMinutes,
	@Size(max = 180) String reason,
	String notes
) {
}
