package com.mediflow.clinic.appointment.dto;

import jakarta.validation.constraints.NotNull;

import com.mediflow.clinic.appointment.entity.AppointmentStatus;

public record AppointmentStatusUpdateRequest(
	@NotNull AppointmentStatus status,
	String notes
) {
}
