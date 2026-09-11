package com.mediflow.clinic.auth.service;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.auth.dto.AuthResponse;
import com.mediflow.clinic.auth.dto.LoginRequest;
import com.mediflow.clinic.auth.dto.OAuthExchangeRequest;
import com.mediflow.clinic.auth.dto.RegisterRequest;
import com.mediflow.clinic.auth.dto.UserResponse;
import com.mediflow.clinic.auth.security.ClinicUserDetailsService;
import com.mediflow.clinic.auth.security.JwtService;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.user.entity.Permission;
import com.mediflow.clinic.user.entity.Role;
import com.mediflow.clinic.user.entity.User;
import com.mediflow.clinic.user.repository.RoleRepository;
import com.mediflow.clinic.user.repository.UserRepository;

@Service
public class AuthService {

	private static final String DEFAULT_REGISTER_ROLE = "PATIENT";

	private final String adminGoogleEmail;
	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final ClinicUserDetailsService userDetailsService;
	private final JwtService jwtService;
	private final RefreshTokenService refreshTokenService;
	private final OAuthLoginCodeService oauthLoginCodeService;

	public AuthService(
		@Value("${app.security.admin-google-email}") String adminGoogleEmail,
		UserRepository userRepository,
		RoleRepository roleRepository,
		PasswordEncoder passwordEncoder,
		AuthenticationManager authenticationManager,
		ClinicUserDetailsService userDetailsService,
		JwtService jwtService,
		RefreshTokenService refreshTokenService,
		OAuthLoginCodeService oauthLoginCodeService
	) {
		this.adminGoogleEmail = normalizeEmail(adminGoogleEmail);
		this.userRepository = userRepository;
		this.roleRepository = roleRepository;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.userDetailsService = userDetailsService;
		this.jwtService = jwtService;
		this.refreshTokenService = refreshTokenService;
		this.oauthLoginCodeService = oauthLoginCodeService;
	}

	@Transactional
	public UserResponse register(RegisterRequest request) {
		String email = normalizeEmail(request.email());
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new ApiException(HttpStatus.CONFLICT, "Email is already registered.");
		}

		Role patientRole = roleRepository.findByName(DEFAULT_REGISTER_ROLE)
			.orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Default patient role is missing."));

		User user = new User();
		user.setEmail(email);
		user.setFullName(request.fullName().trim());
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user.setPhoneNumber(normalizeOptional(request.phoneNumber()));
		user.getRoles().add(patientRole);

		User saved = userRepository.save(user);
		return toUserResponse(saved);
	}

	@Transactional
	public UserResponse login(LoginRequest request) {
		String email = normalizeEmail(request.email());
		if (email.equals(adminGoogleEmail)) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "Admin account must sign in with Google.");
		}
		try {
			authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
		} catch (BadCredentialsException exception) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
		}

		User user = userRepository.findByEmailIgnoreCase(email)
			.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

		ensureTokenIssuable(user);
		return toUserResponse(user);
	}

	@Transactional
	public AuthResponse refresh(String refreshToken) {
		User user = refreshTokenService.consume(refreshToken);
		return issueTokens(user);
	}

	@Transactional
	public UserResponse exchangeOAuthCode(OAuthExchangeRequest request) {
		User user = oauthLoginCodeService.consume(request.code());
		ensureTokenIssuable(user);
		return toUserResponse(user);
	}

	@Transactional
	public String createGoogleLoginCode(String email, String fullName) {
		User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
			.orElseGet(() -> createOAuthPatient(email, fullName));
		return oauthLoginCodeService.create(user);
	}

	@Transactional(readOnly = true)
	public UserResponse currentUser(String email) {
		User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User was not found."));
		return toUserResponse(user);
	}

	public AuthResponse issueTokens(User user) {
		ensureTokenIssuable(user);
		Set<String> roles = roleNames(user);
		Set<String> permissions = permissionCodes(user);
		String accessToken = jwtService.generateAccessToken(
			userDetailsService.loadUserByUsername(user.getEmail()),
			roles,
			permissions
		);
		String refreshToken = refreshTokenService.create(user);

		return new AuthResponse(
			accessToken,
			refreshToken,
			"Bearer",
			jwtService.accessTokenTtlSeconds(),
			toUserResponse(user)
		);
	}

	private void ensureTokenIssuable(User user) {
		if (!user.isEnabled()) {
			throw new ApiException(HttpStatus.FORBIDDEN, "This account is disabled.");
		}
		if (!user.isAccountNonLocked()) {
			throw new ApiException(HttpStatus.FORBIDDEN, "This account is locked.");
		}
		if (!user.isAccountNonExpired()) {
			throw new ApiException(HttpStatus.FORBIDDEN, "This account is expired.");
		}
		if (!user.isCredentialsNonExpired()) {
			throw new ApiException(HttpStatus.FORBIDDEN, "This account credentials are expired.");
		}
	}

	public UserResponse toUserResponse(User user) {
		return new UserResponse(
			user.getId(),
			user.getEmail(),
			user.getFullName(),
			user.getPhoneNumber(),
			roleNames(user),
			permissionCodes(user)
		);
	}

	private User createOAuthPatient(String email, String fullName) {
		Role patientRole = roleRepository.findByName(DEFAULT_REGISTER_ROLE)
			.orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Default patient role is missing."));

		User user = new User();
		user.setEmail(normalizeEmail(email));
		user.setFullName(resolveOAuthName(email, fullName));
		user.setPasswordHash(passwordEncoder.encode("OAUTH2_LOGIN_ONLY"));
		user.getRoles().add(patientRole);
		return userRepository.save(user);
	}

	private String resolveOAuthName(String email, String fullName) {
		if (fullName != null && !fullName.trim().isBlank()) {
			return fullName.trim();
		}
		return normalizeEmail(email).split("@")[0];
	}

	private Set<String> roleNames(User user) {
		return user.getRoles()
			.stream()
			.map(Role::getName)
			.collect(Collectors.toCollection(LinkedHashSet::new));
	}

	private Set<String> permissionCodes(User user) {
		return user.getRoles()
			.stream()
			.flatMap(role -> role.getPermissions().stream())
			.map(Permission::getCode)
			.collect(Collectors.toCollection(LinkedHashSet::new));
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase();
	}

	private String normalizeOptional(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isBlank() ? null : trimmed;
	}
}
