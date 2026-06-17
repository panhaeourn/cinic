package com.mediflow.clinic.auth.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.auth.entity.OAuthLoginCode;
import com.mediflow.clinic.auth.repository.OAuthLoginCodeRepository;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.user.entity.User;

@Service
public class OAuthLoginCodeService {

	private final OAuthLoginCodeRepository oauthLoginCodeRepository;
	private final TokenHashService tokenHashService;
	private final SecureRandom secureRandom = new SecureRandom();

	public OAuthLoginCodeService(
		OAuthLoginCodeRepository oauthLoginCodeRepository,
		TokenHashService tokenHashService
	) {
		this.oauthLoginCodeRepository = oauthLoginCodeRepository;
		this.tokenHashService = tokenHashService;
	}

	@Transactional
	public String create(User user) {
		byte[] randomBytes = new byte[48];
		secureRandom.nextBytes(randomBytes);
		String rawCode = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

		OAuthLoginCode loginCode = new OAuthLoginCode();
		loginCode.setUser(user);
		loginCode.setCodeHash(tokenHashService.sha256Base64(rawCode));
		loginCode.setExpiresAt(Instant.now().plusSeconds(120));
		oauthLoginCodeRepository.save(loginCode);

		return rawCode;
	}

	@Transactional
	public User consume(String rawCode) {
		OAuthLoginCode loginCode = oauthLoginCodeRepository.findByCodeHash(tokenHashService.sha256Base64(rawCode))
			.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "OAuth code is invalid."));

		if (!loginCode.isActive()) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "OAuth code is expired or already used.");
		}

		loginCode.setConsumedAt(Instant.now());
		return loginCode.getUser();
	}
}
