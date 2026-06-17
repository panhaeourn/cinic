package com.mediflow.clinic.appointment.dto;

import java.time.Instant;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AppointmentRescheduleRequest(
	@NotNull Instant scheduledAt,
	@Min(5) @Max(480) Integer durationMinutes,
	String notes
) {
}
