package com.mediflow.clinic.auth.security;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtService jwtService;
	private final ClinicUserDetailsService userDetailsService;

	public JwtAuthenticationFilter(JwtService jwtService, ClinicUserDetailsService userDetailsService) {
		this.jwtService = jwtService;
		this.userDetailsService = userDetailsService;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String path = request.getRequestURI();
		return "OPTIONS".equalsIgnoreCase(request.getMethod())
			|| path.startsWith("/api/auth/csrf")
			|| path.startsWith("/api/auth/login")
			|| path.startsWith("/api/auth/register")
			|| path.startsWith("/api/auth/refresh")
			|| path.startsWith("/api/auth/oauth/google/exchange")
			|| path.startsWith("/oauth2/")
			|| path.startsWith("/login/oauth2/")
			|| path.startsWith("/actuator/")
			|| path.equals("/error");
	}

	@Override
	protected void doFilterInternal(
		HttpServletRequest request,
		HttpServletResponse response,
		FilterChain filterChain
	) throws ServletException, IOException {
		String token = extractBearerToken(request);
		if (token == null || SecurityContextHolder.getContext().getAuthentication() != null) {
			filterChain.doFilter(request, response);
			return;
		}

		try {
			String email = jwtService.extractEmail(token);
			UserDetails userDetails = userDetailsService.loadUserByUsername(email);
			if (jwtService.isValid(token, userDetails)) {
				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
					userDetails,
					null,
					userDetails.getAuthorities()
				);
				authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				SecurityContextHolder.getContext().setAuthentication(authentication);
			}
		} catch (RuntimeException ignored) {
			SecurityContextHolder.clearContext();
		}

		filterChain.doFilter(request, response);
	}

	private String extractBearerToken(HttpServletRequest request) {
		String authorization = request.getHeader("Authorization");
		if (authorization == null || !authorization.startsWith("Bearer ")) {
			return null;
		}
		return authorization.substring(7);
	}
}
