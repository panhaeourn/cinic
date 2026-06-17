package com.mediflow.clinic.vitals.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record VitalsRequest(
	@NotNull UUID patientId,
	UUID queueTicketId,
	UUID encounterId,
	UUID nurseId,
	@Min(40) @Max(260) Integer systolicBp,
	@Min(30) @Max(180) Integer diastolicBp,
	@DecimalMin("30.00") @DecimalMax("45.00") BigDecimal temperatureC,
	@Min(40) @Max(100) Integer oxygenSaturation,
	@Min(20) @Max(240) Integer heartRate,
	@DecimalMin("1.00") @DecimalMax("400.00") BigDecimal weightKg,
	@DecimalMin("20.00") @DecimalMax("260.00") BigDecimal heightCm,
	String notes,
	Instant recordedAt
) {
}
