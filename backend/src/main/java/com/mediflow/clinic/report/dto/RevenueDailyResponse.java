package com.mediflow.clinic.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RevenueDailyResponse(
	LocalDate date,
	BigDecimal grossAmount,
	BigDecimal refundedAmount,
	BigDecimal netAmount
) {
}
