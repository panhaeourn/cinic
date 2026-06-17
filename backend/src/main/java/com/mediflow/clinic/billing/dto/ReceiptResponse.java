package com.mediflow.clinic.billing.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ReceiptResponse(
	UUID invoiceId,
	String invoiceNumber,
	String patientCode,
	String patientName,
	BigDecimal totalAmount,
	BigDecimal paidAmount,
	BigDecimal balanceAmount,
	List<PaymentResponse> payments,
	Instant issuedAt
) {
}
