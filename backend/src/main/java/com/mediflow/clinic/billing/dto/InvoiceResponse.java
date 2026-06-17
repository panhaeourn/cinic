package com.mediflow.clinic.billing.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.mediflow.clinic.billing.entity.InvoiceStatus;

public record InvoiceResponse(
	UUID id,
	String invoiceNumber,
	UUID patientId,
	String patientCode,
	String patientName,
	InvoiceStatus status,
	BigDecimal subtotal,
	BigDecimal discountAmount,
	BigDecimal taxAmount,
	BigDecimal totalAmount,
	BigDecimal paidAmount,
	BigDecimal balanceAmount,
	String notes,
	Instant issuedAt,
	Instant dueAt,
	List<InvoiceItemResponse> items,
	List<PaymentResponse> payments,
	Instant createdAt,
	Instant updatedAt
) {
}
