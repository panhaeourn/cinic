package com.mediflow.clinic.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.user.entity.Role;
import com.mediflow.clinic.user.entity.User;
import com.mediflow.clinic.user.repository.RoleRepository;
import com.mediflow.clinic.user.repository.UserRepository;

@Service
public class GoogleOAuth2LoginService {

	private static final String DEFAULT_GOOGLE_ROLE = "PATIENT";
	private static final String ADMIN_GOOGLE_ROLE = "ADMIN";

	private final String adminGoogleEmail;
	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;
	private final OAuthLoginCodeService oauthLoginCodeService;

	public GoogleOAuth2LoginService(
		@Value("${app.security.admin-google-email}") String adminGoogleEmail,
		UserRepository userRepository,
		RoleRepository roleRepository,
		PasswordEncoder passwordEncoder,
		OAuthLoginCodeService oauthLoginCodeService
	) {
		this.adminGoogleEmail = normalizeEmail(adminGoogleEmail);
		this.userRepository = userRepository;
		this.roleRepository = roleRepository;
		this.passwordEncoder = passwordEncoder;
		this.oauthLoginCodeService = oauthLoginCodeService;
	}

	@Transactional
	public String createLoginCode(String email, String fullName) {
		User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
			.orElseGet(() -> createGooglePatient(email, fullName));
		ensureAdminGoogleRole(user);
		return oauthLoginCodeService.create(user);
	}

	private void ensureAdminGoogleRole(User user) {
		if (!normalizeEmail(user.getEmail()).equals(adminGoogleEmail)) {
			return;
		}
		boolean alreadyAdmin = user.getRoles().stream().anyMatch(role -> ADMIN_GOOGLE_ROLE.equals(role.getName()));
		if (alreadyAdmin) {
			return;
		}
		Role adminRole = roleRepository.findByName(ADMIN_GOOGLE_ROLE)
			.orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Admin role is missing."));
		user.getRoles().add(adminRole);
		userRepository.save(user);
	}

	private User createGooglePatient(String email, String fullName) {
		String roleName = normalizeEmail(email).equals(adminGoogleEmail) ? ADMIN_GOOGLE_ROLE : DEFAULT_GOOGLE_ROLE;
		Role role = roleRepository.findByName(roleName)
			.orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Default Google role is missing."));

		User user = new User();
		user.setEmail(normalizeEmail(email));
		user.setFullName(resolveName(email, fullName));
		user.setPasswordHash(passwordEncoder.encode("OAUTH2_LOGIN_ONLY"));
		user.getRoles().add(role);
		return userRepository.save(user);
	}

	private String resolveName(String email, String fullName) {
		if (fullName != null && !fullName.trim().isBlank()) {
			return fullName.trim();
		}
		return normalizeEmail(email).split("@")[0];
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase();
	}
}
