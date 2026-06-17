package com.mediflow.clinic.encounter.dto;

import java.time.Instant;
import java.util.UUID;

import com.mediflow.clinic.encounter.entity.EncounterStatus;

public record EncounterResponse(
	UUID id,
	UUID patientId,
	String patientCode,
	String patientName,
	UUID doctorId,
	String doctorName,
	UUID queueTicketId,
	String queueCode,
	EncounterStatus status,
	String chiefComplaint,
	String symptoms,
	String diagnosis,
	String notes,
	Instant startedAt,
	Instant completedAt,
	Instant createdAt,
	Instant updatedAt
) {
}
