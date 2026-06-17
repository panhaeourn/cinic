package com.mediflow.clinic.report.dto;

import java.math.BigDecimal;
import java.util.List;

public record RevenueReportResponse(
	BigDecimal invoiceTotal,
	BigDecimal unpaidBalance,
	BigDecimal grossReceived,
	BigDecimal refundedAmount,
	BigDecimal netReceived,
	List<RevenueDailyResponse> dailyRevenue
) {
}
