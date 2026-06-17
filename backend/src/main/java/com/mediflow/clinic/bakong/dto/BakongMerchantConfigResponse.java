package com.mediflow.clinic.bakong.dto;

public record BakongMerchantConfigResponse(
	String bakongAccountId,
	String merchantName,
	String merchantCity,
	String acquiringBank,
	String currency,
	int qrExpirySeconds
) {
}
