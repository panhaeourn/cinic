package com.mediflow.clinic.encounter.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

import com.mediflow.clinic.encounter.entity.EncounterStatus;

public record EncounterUpdateRequest(
	@NotNull UUID patientId,
	UUID doctorId,
	UUID queueTicketId,
	@NotNull EncounterStatus status,
	String chiefComplaint,
	String symptoms,
	String diagnosis,
	String notes
) {
}
