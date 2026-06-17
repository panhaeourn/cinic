package com.mediflow.clinic.report.dto;

public record PatientReportResponse(
	long totalPatients,
	long newPatients,
	long portalLinkedPatients
) {
}
