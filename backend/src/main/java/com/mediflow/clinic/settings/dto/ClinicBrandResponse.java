package com.mediflow.clinic.settings.dto;

public record ClinicBrandResponse(
	String clinicName,
	String logoUrl,
	String currency,
	String invoicePrefix,
	String bakongMerchantName,
	String bakongCurrency
) {
}
