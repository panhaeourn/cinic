package com.mediflow.clinic.report.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CashierIncomeReportResponse(
	UUID cashierUserId,
	String cashierName,
	String cashierEmail,
	BigDecimal grossAmount,
	BigDecimal refundedAmount,
	BigDecimal netAmount,
	long paymentCount
) {
}
