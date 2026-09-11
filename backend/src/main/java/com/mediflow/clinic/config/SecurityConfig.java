package com.mediflow.clinic.config;

import static org.springframework.security.config.Customizer.withDefaults;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.mediflow.clinic.auth.security.GoogleOAuth2FailureHandler;
import com.mediflow.clinic.auth.security.GoogleOAuth2SuccessHandler;
import com.mediflow.clinic.auth.security.AuthRateLimitFilter;
import com.mediflow.clinic.auth.security.JwtAuthenticationFilter;
import com.mediflow.clinic.auth.security.RestAuthenticationEntryPoint;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

	private final String allowedOrigins;
	private final boolean secureCookies;
	private final AuthRateLimitFilter authRateLimitFilter;
	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final RestAuthenticationEntryPoint authenticationEntryPoint;
	private final GoogleOAuth2SuccessHandler googleOAuth2SuccessHandler;
	private final GoogleOAuth2FailureHandler googleOAuth2FailureHandler;

	public SecurityConfig(
		@Value("${app.security.allowed-origins}") String allowedOrigins,
		@Value("${app.security.secure-cookies:false}") boolean secureCookies,
		AuthRateLimitFilter authRateLimitFilter,
		JwtAuthenticationFilter jwtAuthenticationFilter,
		RestAuthenticationEntryPoint authenticationEntryPoint,
		GoogleOAuth2SuccessHandler googleOAuth2SuccessHandler,
		GoogleOAuth2FailureHandler googleOAuth2FailureHandler
	) {
		this.allowedOrigins = allowedOrigins;
		this.secureCookies = secureCookies;
		this.authRateLimitFilter = authRateLimitFilter;
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
		this.authenticationEntryPoint = authenticationEntryPoint;
		this.googleOAuth2SuccessHandler = googleOAuth2SuccessHandler;
		this.googleOAuth2FailureHandler = googleOAuth2FailureHandler;
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
		csrfRepository.setCookieCustomizer(cookie -> cookie
			.path("/")
			.sameSite("Lax")
			.secure(secureCookies));
		CsrfTokenRequestAttributeHandler csrfRequestHandler = new CsrfTokenRequestAttributeHandler();
		csrfRequestHandler.setCsrfRequestAttributeName(null);

		http
			.csrf(csrf -> csrf
				.csrfTokenRepository(csrfRepository)
				.csrfTokenRequestHandler(csrfRequestHandler))
			.cors(withDefaults())
			.headers(headers -> headers
				.contentTypeOptions(withDefaults())
				.frameOptions(frame -> frame.deny())
				.contentSecurityPolicy(csp -> csp.policyDirectives(
					"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
				))
				.referrerPolicy(referrer -> referrer.policy(ReferrerPolicy.NO_REFERRER))
				.permissionsPolicy(policy -> policy.policy(
					"camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()"
				))
			)
			.sessionManagement(session -> session
				.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
				.sessionFixation(fixation -> fixation.migrateSession()))
			.exceptionHandling(exception -> exception.authenticationEntryPoint(authenticationEntryPoint))
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
				.requestMatchers("/actuator/health", "/actuator/info", "/error").permitAll()
				.requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
				.requestMatchers(
					"/api/auth/csrf",
					"/api/auth/register",
					"/api/auth/login",
					"/api/auth/refresh",
					"/api/auth/oauth/google/exchange",
					"/api/settings/brand"
				).permitAll()
				.anyRequest().authenticated())
			.oauth2Login(oauth -> oauth
				.successHandler(googleOAuth2SuccessHandler)
				.failureHandler(googleOAuth2FailureHandler))
			.logout(logout -> logout
				.logoutUrl("/api/auth/logout")
				.invalidateHttpSession(true)
				.clearAuthentication(true)
				.deleteCookies("JSESSIONID", "XSRF-TOKEN")
				.logoutSuccessHandler((request, response, authentication) -> response.setStatus(204)))
			.addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
			.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}

	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(parseAllowedOrigins());
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "X-XSRF-TOKEN"));
		configuration.setExposedHeaders(List.of("Authorization"));
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

	private List<String> parseAllowedOrigins() {
		return Arrays.stream(allowedOrigins.split(","))
			.map(String::trim)
			.filter(origin -> !origin.isBlank())
			.toList();
	}
}
