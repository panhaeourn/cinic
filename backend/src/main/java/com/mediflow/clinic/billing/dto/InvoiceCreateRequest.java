package com.mediflow.clinic.billing.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InvoiceCreateRequest(
	@NotNull(message = "Patient is required.")
	UUID patientId,

	@NotEmpty(message = "At least one invoice item is required.")
	@Size(max = 40, message = "An invoice can contain up to 40 line items.")
	List<@Valid InvoiceItemRequest> items,

	@DecimalMin(value = "0.00", message = "Discount cannot be negative.")
	@Digits(integer = 10, fraction = 2, message = "Discount must fit 10 digits and 2 decimals.")
	BigDecimal discountAmount,

	@DecimalMin(value = "0.00", message = "Tax cannot be negative.")
	@Digits(integer = 10, fraction = 2, message = "Tax must fit 10 digits and 2 decimals.")
	BigDecimal taxAmount,

	@Size(max = 1000, message = "Notes must be 1000 characters or fewer.")
	String notes,

	Instant dueAt
) {
}
