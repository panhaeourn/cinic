package com.mediflow.clinic.encounter.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record EncounterCreateRequest(
	@NotNull UUID patientId,
	UUID doctorId,
	UUID queueTicketId,
	String chiefComplaint,
	String symptoms,
	String diagnosis,
	String notes
) {
}
