package com.mediflow.clinic.auth.security;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

@Component
public class GoogleOAuth2FailureHandler implements AuthenticationFailureHandler {

	private final String frontendUrl;

	public GoogleOAuth2FailureHandler(@Value("${app.frontend-url}") String frontendUrl) {
		this.frontendUrl = frontendUrl;
	}

	@Override
	public void onAuthenticationFailure(
		HttpServletRequest request,
		HttpServletResponse response,
		AuthenticationException exception
	) throws IOException {
		String message = exception == null ? "Google sign-in failed." : exception.getMessage();
		response.sendRedirect(frontendUrl.replaceAll("/+$", "") + "/login?oauthError="
			+ URLEncoder.encode(message, StandardCharsets.UTF_8));
	}
}
