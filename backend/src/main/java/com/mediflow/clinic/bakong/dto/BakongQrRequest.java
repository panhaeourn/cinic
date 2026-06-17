package com.mediflow.clinic.bakong.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record BakongQrRequest(
	@NotNull @DecimalMin("0.01") BigDecimal amount,
	Long expirySeconds
) {
}
