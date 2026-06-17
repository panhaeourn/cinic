package com.mediflow.clinic.encounter.dto;

public record EncounterCompleteRequest(
	String diagnosis,
	String notes
) {
}
