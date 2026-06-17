package com.mediflow.clinic.billing.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.mediflow.clinic.billing.entity.InvoiceItemType;

public record InvoiceItemRequest(
	InvoiceItemType itemType,

	@NotBlank(message = "Invoice item description is required.")
	@Size(max = 180, message = "Invoice item description must be 180 characters or fewer.")
	String description,

	@NotNull(message = "Quantity is required.")
	@DecimalMin(value = "0.01", message = "Quantity must be greater than zero.")
	@Digits(integer = 8, fraction = 2, message = "Quantity must fit 8 digits and 2 decimals.")
	BigDecimal quantity,

	@NotNull(message = "Unit price is required.")
	@DecimalMin(value = "0.00", message = "Unit price cannot be negative.")
	@Digits(integer = 10, fraction = 2, message = "Unit price must fit 10 digits and 2 decimals.")
	BigDecimal unitPrice
) {
}
