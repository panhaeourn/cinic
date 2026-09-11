package com.mediflow.clinic.billing.dto;

import java.math.BigDecimal;

public record PaymentSummaryResponse(
	BigDecimal grossAmount,
	BigDecimal refundedAmount,
	BigDecimal netAmount,
	long paymentCount
) {
}
