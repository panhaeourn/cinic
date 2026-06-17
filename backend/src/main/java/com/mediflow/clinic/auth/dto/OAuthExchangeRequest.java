package com.mediflow.clinic.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record OAuthExchangeRequest(
	@NotBlank(message = "OAuth code is required")
	String code
) {
}
