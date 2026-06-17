package com.mediflow.clinic.billing.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.mediflow.clinic.billing.entity.InvoiceItemType;

public record ServicePriceResponse(
	UUID id,
	String code,
	String name,
	InvoiceItemType itemType,
	String category,
	BigDecimal price,
	boolean active,
	Instant createdAt,
	Instant updatedAt
) {
}
