package com.mediflow.clinic.auth.security;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import tools.jackson.databind.ObjectMapper;
import com.mediflow.clinic.common.exception.ApiErrorResponse;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

	private static final String[] PROTECTED_PATHS = {
		"/api/auth/login",
		"/api/auth/register",
		"/api/auth/refresh",
		"/api/auth/oauth/google/exchange"
	};

	private final ObjectMapper objectMapper;
	private final Map<String, AttemptWindow> attempts = new ConcurrentHashMap<>();
	private final AtomicLong requestCount = new AtomicLong();
	private final int maxAttempts;
	private final long windowSeconds;
	private final int maxTrackedClients;

	public AuthRateLimitFilter(
		ObjectMapper objectMapper,
		@Value("${app.security.auth-rate-limit.max-attempts:8}") int maxAttempts,
		@Value("${app.security.auth-rate-limit.window-seconds:300}") long windowSeconds,
		@Value("${app.security.auth-rate-limit.max-tracked-clients:10000}") int maxTrackedClients
	) {
		this.objectMapper = objectMapper;
		this.maxAttempts = maxAttempts;
		this.windowSeconds = windowSeconds;
		this.maxTrackedClients = maxTrackedClients;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		if (!"POST".equalsIgnoreCase(request.getMethod())) {
			return true;
		}
		String path = request.getRequestURI();
		for (String protectedPath : PROTECTED_PATHS) {
			if (protectedPath.equals(path)) {
				return false;
			}
		}
		return true;
	}

	@Override
	protected void doFilterInternal(
		HttpServletRequest request,
		HttpServletResponse response,
		FilterChain filterChain
	) throws ServletException, IOException {
		String key = request.getRequestURI() + "|" + clientAddress(request);
		long now = Instant.now().getEpochSecond();
		if ((requestCount.incrementAndGet() & 255) == 0 || attempts.size() >= maxTrackedClients) {
			attempts.entrySet().removeIf(entry -> entry.getValue().windowExpiresAt <= now);
		}
		if (!attempts.containsKey(key) && attempts.size() >= maxTrackedClients) {
			writeRateLimitResponse(request, response, windowSeconds);
			return;
		}
		AttemptWindow window = attempts.compute(key, (ignored, current) -> {
			if (current == null || current.windowExpiresAt <= now) {
				return new AttemptWindow(1, now + windowSeconds);
			}
			return new AttemptWindow(current.attemptCount + 1, current.windowExpiresAt);
		});

		if (window.attemptCount > maxAttempts) {
			long retryAfter = Math.max(1, window.windowExpiresAt - now);
			writeRateLimitResponse(request, response, retryAfter);
			return;
		}

		filterChain.doFilter(request, response);
		if (response.getStatus() < 400) {
			attempts.remove(key);
		}
	}

	private String clientAddress(HttpServletRequest request) {
		String forwardedFor = request.getHeader("X-Forwarded-For");
		if (isTrustedProxy(request.getRemoteAddr()) && forwardedFor != null && !forwardedFor.isBlank()) {
			return forwardedFor.split(",")[0].trim();
		}
		return request.getRemoteAddr();
	}

	private boolean isTrustedProxy(String address) {
		return address != null && (
			address.equals("127.0.0.1")
				|| address.equals("::1")
				|| address.startsWith("10.")
				|| address.startsWith("192.168.")
				|| address.matches("172\\.(1[6-9]|2\\d|3[01])\\..*")
		);
	}

	private void writeRateLimitResponse(
		HttpServletRequest request,
		HttpServletResponse response,
		long retryAfter
	) throws IOException {
		response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setHeader("Retry-After", String.valueOf(Math.max(1, retryAfter)));
		objectMapper.writeValue(
			response.getWriter(),
			ApiErrorResponse.of(
				HttpStatus.TOO_MANY_REQUESTS.value(),
				HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
				"Too many authentication attempts. Please wait and try again.",
				request.getRequestURI()
			)
		);
	}

	private record AttemptWindow(int attemptCount, long windowExpiresAt) {
	}
}
