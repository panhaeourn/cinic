package com.mediflow.clinic.bakong.dto;

import java.math.BigDecimal;

public record BakongQrResponse(
	boolean success,
	BigDecimal amount,
	String qr,
	String md5,
	long expiresAt,
	long remainingSeconds
) {
}
