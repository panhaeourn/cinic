package com.mediflow.clinic.auth.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

@Service
public class BrowserSessionService {

	private final ClinicUserDetailsService userDetailsService;
	private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

	public BrowserSessionService(ClinicUserDetailsService userDetailsService) {
		this.userDetailsService = userDetailsService;
	}

	public void establish(HttpServletRequest request, HttpServletResponse response, String email) {
		UserDetails principal = userDetailsService.loadUserByUsername(email);
		var authentication = UsernamePasswordAuthenticationToken.authenticated(
			principal,
			null,
			principal.getAuthorities()
		);
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(authentication);
		SecurityContextHolder.setContext(context);
		request.getSession(true);
		request.changeSessionId();
		securityContextRepository.saveContext(context, request, response);
	}

	public void refresh(HttpServletRequest request, HttpServletResponse response, String email) {
		establish(request, response, email);
	}
}
