package com.mediflow.clinic.settings.dto;

import java.time.Instant;

public record ClinicSettingsResponse(
	String clinicName,
	String logoUrl,
	String address,
	String phone,
	String email,
	String currency,
	String invoicePrefix,
	String googleClientId,
	String googleRedirectUri,
	String bakongAccountId,
	String bakongMerchantName,
	String bakongMerchantCity,
	String bakongAccountInformation,
	String bakongCurrency,
	boolean notificationsEnabled,
	boolean emailNotifications,
	boolean smsNotifications,
	Instant updatedAt
) {
}
