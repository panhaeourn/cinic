package com.mediflow.clinic.report.dto;

import java.util.List;

public record AppointmentReportResponse(
	long totalAppointments,
	List<StatusCountResponse> byStatus
) {
}
