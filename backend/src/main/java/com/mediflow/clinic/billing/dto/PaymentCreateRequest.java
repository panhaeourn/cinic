package com.mediflow.clinic.billing.dto;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.mediflow.clinic.billing.entity.PaymentMethod;

public record PaymentCreateRequest(
	@NotNull(message = "Payment method is required.")
	PaymentMethod method,

	@NotNull(message = "Payment amount is required.")
	@DecimalMin(value = "0.01", message = "Payment amount must be greater than zero.")
	@Digits(integer = 10, fraction = 2, message = "Payment amount must fit 10 digits and 2 decimals.")
	BigDecimal amount,

	@Size(max = 120, message = "Reference number must be 120 characters or fewer.")
	String referenceNumber,

	@Size(max = 1000, message = "Payment note must be 1000 characters or fewer.")
	String note,

	Instant paidAt
) {
}
