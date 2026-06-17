package com.mediflow.clinic.queue.dto;

import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record QueueCheckInRequest(
	@NotNull UUID patientId,
	UUID appointmentId,
	UUID assignedStaffId,
	@Min(0) @Max(10) Integer priority,
	String notes
) {
}
