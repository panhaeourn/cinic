package com.mediflow.clinic.auth.dto;

public record AuthResponse(
	String accessToken,
	String refreshToken,
	String tokenType,
	long expiresInSeconds,
	UserResponse user
) {
}
