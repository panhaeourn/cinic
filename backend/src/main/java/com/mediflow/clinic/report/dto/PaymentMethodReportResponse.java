package com.mediflow.clinic.report.dto;

import java.math.BigDecimal;

public record PaymentMethodReportResponse(
	String method,
	BigDecimal grossAmount,
	BigDecimal refundedAmount,
	BigDecimal netAmount,
	long paymentCount
) {
}
