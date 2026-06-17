package com.mediflow.clinic.auth.security;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.mediflow.clinic.auth.service.GoogleOAuth2LoginService;

@Component
public class GoogleOAuth2SuccessHandler implements AuthenticationSuccessHandler {

	private final GoogleOAuth2LoginService googleOAuth2LoginService;
	private final String frontendUrl;

	public GoogleOAuth2SuccessHandler(
		GoogleOAuth2LoginService googleOAuth2LoginService,
		@Value("${app.frontend-url}") String frontendUrl
	) {
		this.googleOAuth2LoginService = googleOAuth2LoginService;
		this.frontendUrl = frontendUrl;
	}

	@Override
	public void onAuthenticationSuccess(
		HttpServletRequest request,
		HttpServletResponse response,
		Authentication authentication
	) throws IOException {
		OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
		String email = normalize(oauthUser.getAttribute("email"));
		if (email == null) {
			redirectFailure(response, "Google did not provide an email address.");
			return;
		}

		String fullName = oauthUser.getAttribute("name");
		String code = googleOAuth2LoginService.createLoginCode(email, fullName);
		response.sendRedirect(frontendBaseUrl() + "/oauth/callback?code=" + URLEncoder.encode(code, StandardCharsets.UTF_8));
	}

	private void redirectFailure(HttpServletResponse response, String message) throws IOException {
		response.sendRedirect(frontendBaseUrl() + "/login?oauthError=" + URLEncoder.encode(message, StandardCharsets.UTF_8));
	}

	private String normalize(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim().toLowerCase();
		return trimmed.isBlank() ? null : trimmed;
	}

	private String frontendBaseUrl() {
		return frontendUrl.replaceAll("/+$", "");
	}
}
