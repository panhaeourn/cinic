package com.mediflow.clinic.settings.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClinicSettingsRequest(
	@NotBlank @Size(max = 160) String clinicName,
	String logoUrl,
	String address,
	@Size(max = 40) String phone,
	@Size(max = 180) String email,
	@NotBlank @Size(max = 8) String currency,
	@NotBlank @Size(max = 12) String invoicePrefix,
	@Size(max = 240) String googleClientId,
	@Size(max = 240) String googleRedirectUri,
	@Size(max = 120) String bakongAccountId,
	@Size(max = 160) String bakongMerchantName,
	@Size(max = 120) String bakongMerchantCity,
	@Size(max = 160) String bakongAccountInformation,
	@NotBlank @Size(max = 8) String bakongCurrency,
	boolean notificationsEnabled,
	boolean emailNotifications,
	boolean smsNotifications
) {
}
