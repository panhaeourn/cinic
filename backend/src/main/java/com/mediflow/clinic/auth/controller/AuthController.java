package com.mediflow.clinic.auth.controller;

import java.security.Principal;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.web.csrf.CsrfToken;

import com.mediflow.clinic.auth.dto.AuthResponse;
import com.mediflow.clinic.auth.dto.AuthSessionResponse;
import com.mediflow.clinic.auth.dto.CsrfTokenResponse;
import com.mediflow.clinic.auth.dto.LoginRequest;
import com.mediflow.clinic.auth.dto.OAuthExchangeRequest;
import com.mediflow.clinic.auth.dto.RefreshTokenRequest;
import com.mediflow.clinic.auth.dto.RegisterRequest;
import com.mediflow.clinic.auth.dto.UserResponse;
import com.mediflow.clinic.auth.service.AuthService;
import com.mediflow.clinic.auth.security.BrowserSessionService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;
	private final BrowserSessionService browserSessionService;

	public AuthController(AuthService authService, BrowserSessionService browserSessionService) {
		this.authService = authService;
		this.browserSessionService = browserSessionService;
	}

	@GetMapping("/csrf")
	public CsrfTokenResponse csrf(CsrfToken token) {
		return new CsrfTokenResponse(token.getHeaderName(), token.getToken());
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthSessionResponse register(
		@Valid @RequestBody RegisterRequest request,
		HttpServletRequest httpRequest,
		HttpServletResponse httpResponse
	) {
		UserResponse user = authService.register(request);
		browserSessionService.establish(httpRequest, httpResponse, user.email());
		return new AuthSessionResponse(user);
	}

	@PostMapping("/login")
	public AuthSessionResponse login(
		@Valid @RequestBody LoginRequest request,
		HttpServletRequest httpRequest,
		HttpServletResponse httpResponse
	) {
		UserResponse user = authService.login(request);
		browserSessionService.establish(httpRequest, httpResponse, user.email());
		return new AuthSessionResponse(user);
	}

	@PostMapping("/refresh")
	public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
		return authService.refresh(request.refreshToken());
	}

	@PostMapping("/oauth/google/exchange")
	public AuthSessionResponse exchangeGoogleOAuthCode(
		@Valid @RequestBody OAuthExchangeRequest request,
		HttpServletRequest httpRequest,
		HttpServletResponse httpResponse
	) {
		UserResponse user = authService.exchangeOAuthCode(request);
		browserSessionService.establish(httpRequest, httpResponse, user.email());
		return new AuthSessionResponse(user);
	}

	@GetMapping("/me")
	public UserResponse me(Principal principal) {
		return authService.currentUser(principal.getName());
	}
}
