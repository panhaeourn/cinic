package com.mediflow.clinic.vitals.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record VitalsResponse(
	UUID id,
	UUID patientId,
	String patientCode,
	String patientName,
	UUID queueTicketId,
	String queueCode,
	UUID encounterId,
	UUID nurseId,
	String nurseName,
	Integer systolicBp,
	Integer diastolicBp,
	BigDecimal temperatureC,
	Integer oxygenSaturation,
	Integer heartRate,
	BigDecimal weightKg,
	BigDecimal heightCm,
	String notes,
	Instant recordedAt,
	Instant createdAt,
	Instant updatedAt
) {
}
