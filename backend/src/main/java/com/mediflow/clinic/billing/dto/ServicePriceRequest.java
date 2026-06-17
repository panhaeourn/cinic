package com.mediflow.clinic.billing.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.mediflow.clinic.billing.entity.InvoiceItemType;

public record ServicePriceRequest(
	@NotBlank(message = "Service code is required.")
	@Size(max = 40, message = "Service code must be 40 characters or fewer.")
	String code,

	@NotBlank(message = "Service name is required.")
	@Size(max = 160, message = "Service name must be 160 characters or fewer.")
	String name,

	@NotNull(message = "Service type is required.")
	InvoiceItemType itemType,

	@NotBlank(message = "Category is required.")
	@Size(max = 80, message = "Category must be 80 characters or fewer.")
	String category,

	@NotNull(message = "Price is required.")
	@DecimalMin(value = "0.00", message = "Price cannot be negative.")
	@Digits(integer = 10, fraction = 2, message = "Price must fit 10 digits and 2 decimals.")
	BigDecimal price,

	Boolean active
) {
}
