package com.mediflow.clinic.auth.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.auth.entity.RefreshToken;
import com.mediflow.clinic.auth.repository.RefreshTokenRepository;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.user.entity.User;

@Service
public class RefreshTokenService {

	private final RefreshTokenRepository refreshTokenRepository;
	private final TokenHashService tokenHashService;
	private final SecureRandom secureRandom = new SecureRandom();
	private final long refreshTokenTtlDays;

	public RefreshTokenService(
		RefreshTokenRepository refreshTokenRepository,
		TokenHashService tokenHashService,
		@Value("${app.security.refresh-token-ttl-days}") long refreshTokenTtlDays
	) {
		this.refreshTokenRepository = refreshTokenRepository;
		this.tokenHashService = tokenHashService;
		this.refreshTokenTtlDays = refreshTokenTtlDays;
	}

	@Transactional
	public String create(User user) {
		byte[] randomBytes = new byte[64];
		secureRandom.nextBytes(randomBytes);
		String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

		RefreshToken refreshToken = new RefreshToken();
		refreshToken.setUser(user);
		refreshToken.setTokenHash(tokenHashService.sha256Base64(rawToken));
		refreshToken.setExpiresAt(Instant.now().plusSeconds(refreshTokenTtlDays * 24 * 60 * 60));
		refreshTokenRepository.save(refreshToken);

		return rawToken;
	}

	@Transactional
	public User consume(String rawToken) {
		RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHashService.sha256Base64(rawToken))
			.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid."));

		if (!refreshToken.isActive()) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token is expired or revoked.");
		}

		refreshToken.setRevokedAt(Instant.now());
		return refreshToken.getUser();
	}

	@Transactional
	public void revokeAllActiveTokens(User user) {
		if (user == null || user.getId() == null) {
			return;
		}
		refreshTokenRepository.revokeAllActiveByUserId(user.getId(), Instant.now());
	}
}
