package com.mediflow.clinic.report.dto;

import java.time.LocalDate;

public record ReportRangeResponse(
	LocalDate from,
	LocalDate to
) {
}
