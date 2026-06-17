package com.mediflow.clinic.billing.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.mediflow.clinic.billing.entity.PaymentMethod;

public record PaymentResponse(
	UUID id,
	UUID invoiceId,
	String invoiceNumber,
	String patientCode,
	String patientName,
	String paymentNumber,
	PaymentMethod method,
	BigDecimal amount,
	BigDecimal refundedAmount,
	BigDecimal netAmount,
	UUID receivedByUserId,
	String receivedByName,
	String receivedByEmail,
	String referenceNumber,
	String note,
	String refundReason,
	Instant refundedAt,
	Instant paidAt,
	Instant createdAt
) {
}
