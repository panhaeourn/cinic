package com.mediflow.clinic.report.dto;

public record DoctorConsultationReportResponse(
	String doctorCode,
	String doctorName,
	long completedConsultations
) {
}
