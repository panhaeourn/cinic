package com.mediflow.clinic.auth.security;

import java.time.Instant;
import java.util.Date;
import java.util.Set;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	private final SecretKey signingKey;
	private final long accessTokenTtlMinutes;

	public JwtService(
		@Value("${app.security.jwt-secret-base64}") String secretBase64,
		@Value("${app.security.access-token-ttl-minutes}") long accessTokenTtlMinutes
	) {
		this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretBase64));
		this.accessTokenTtlMinutes = accessTokenTtlMinutes;
	}

	public String generateAccessToken(UserDetails userDetails, Set<String> roles, Set<String> permissions) {
		Instant now = Instant.now();
		Instant expiry = now.plusSeconds(accessTokenTtlSeconds());

		return Jwts.builder()
			.subject(userDetails.getUsername())
			.issuedAt(Date.from(now))
			.expiration(Date.from(expiry))
			.claim("roles", roles)
			.claim("permissions", permissions)
			.signWith(signingKey)
			.compact();
	}

	public String extractEmail(String token) {
		return extractClaim(token, Claims::getSubject);
	}

	public long accessTokenTtlSeconds() {
		return accessTokenTtlMinutes * 60;
	}

	public boolean isValid(String token, UserDetails userDetails) {
		String email = extractEmail(token);
		return email.equalsIgnoreCase(userDetails.getUsername()) && !isExpired(token);
	}

	private boolean isExpired(String token) {
		return extractClaim(token, Claims::getExpiration).before(new Date());
	}

	private <T> T extractClaim(String token, Function<Claims, T> resolver) {
		return resolver.apply(Jwts.parser()
			.verifyWith(signingKey)
			.build()
			.parseSignedClaims(token)
			.getPayload());
	}
}
