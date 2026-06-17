package com.mediflow.clinic.billing.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.mediflow.clinic.billing.entity.InvoiceItemType;

public record InvoiceItemResponse(
	UUID id,
	InvoiceItemType itemType,
	String description,
	BigDecimal quantity,
	BigDecimal unitPrice,
	BigDecimal lineTotal,
	Instant createdAt
) {
}
