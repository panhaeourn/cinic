package com.mediflow.clinic.report.dto;

import java.util.List;

public record ReportSummaryResponse(
	ReportRangeResponse range,
	RevenueReportResponse revenue,
	PatientReportResponse patients,
	AppointmentReportResponse appointments,
	List<DoctorConsultationReportResponse> doctorConsultations,
	InventoryReportResponse inventory,
	PaymentReportResponse payments
) {
}
