package com.mediflow.clinic.report.dto;

import java.math.BigDecimal;
import java.util.List;

public record PaymentReportResponse(
	BigDecimal grossReceived,
	BigDecimal refundedAmount,
	BigDecimal netReceived,
	long paymentCount,
	List<PaymentMethodReportResponse> byMethod,
	List<CashierIncomeReportResponse> byCashier
) {
}
