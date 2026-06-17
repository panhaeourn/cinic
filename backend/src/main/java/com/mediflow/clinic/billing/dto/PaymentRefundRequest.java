package com.mediflow.clinic.billing.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PaymentRefundRequest(
	@NotNull(message = "Refund amount is required.")
	@DecimalMin(value = "0.01", message = "Refund amount must be greater than zero.")
	@Digits(integer = 10, fraction = 2, message = "Refund amount must fit 10 digits and 2 decimals.")
	BigDecimal amount,

	@Size(max = 1000, message = "Refund reason must be 1000 characters or fewer.")
	String reason
) {
}
