package com.mediflow.clinic.staff.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.auth.dto.AuthResponse;
import com.mediflow.clinic.auth.service.AuthService;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.staff.dto.StaffClaimResponse;
import com.mediflow.clinic.staff.entity.Staff;
import com.mediflow.clinic.staff.entity.StaffClaimToken;
import com.mediflow.clinic.staff.repository.StaffClaimTokenRepository;
import com.mediflow.clinic.staff.repository.StaffRepository;
import com.mediflow.clinic.user.entity.Role;
import com.mediflow.clinic.user.entity.User;
import com.mediflow.clinic.user.repository.RoleRepository;
import com.mediflow.clinic.user.repository.UserRepository;

@Service
public class StaffClaimService {

	private static final char[] CLAIM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
	private static final int CLAIM_CODE_LENGTH = 6;
	private static final int CLAIM_CODE_EXPIRY_DAYS = 1;
	private static final String PATIENT_ROLE_NAME = "PATIENT";
	private static final String ADMIN_ROLE_NAME = "ADMIN";
	private static final Set<String> STAFF_ROLE_NAMES = Set.of(
		ADMIN_ROLE_NAME,
		"DOCTOR",
		"PHARMACIST",
		"RECEPTIONIST_CASHIER",
		"NURSE"
	);

	private final String adminGoogleEmail;
	private final SecureRandom secureRandom = new SecureRandom();
	private final StaffRepository staffRepository;
	private final StaffClaimTokenRepository staffClaimTokenRepository;
	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final AuthService authService;

	public StaffClaimService(
		@Value("${app.security.admin-google-email}") String adminGoogleEmail,
		StaffRepository staffRepository,
		StaffClaimTokenRepository staffClaimTokenRepository,
		UserRepository userRepository,
		RoleRepository roleRepository,
		AuthService authService
	) {
		this.adminGoogleEmail = normalizeEmail(adminGoogleEmail);
		this.staffRepository = staffRepository;
		this.staffClaimTokenRepository = staffClaimTokenRepository;
		this.userRepository = userRepository;
		this.roleRepository = roleRepository;
		this.authService = authService;
	}

	@Transactional
	public StaffClaimResponse generate(UUID staffId, String adminEmail) {
		Staff staff = staffRepository.findById(staffId)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Staff profile was not found."));
		if (staff.getUser() != null) {
			throw new ApiException(HttpStatus.CONFLICT, "This staff profile is already linked to a login account.");
		}
		if (staff.getEmail() == null || staff.getEmail().isBlank()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Staff Gmail is required before generating a claim code.");
		}

		Instant now = Instant.now();
		expireOpenCodes(staffId, now);
		StaffClaimToken token = new StaffClaimToken();
		token.setStaff(staff);
		token.setClaimCode(generateUniqueCode());
		token.setTargetEmail(normalizeEmail(staff.getEmail()));
		token.setRoleName(staff.getRoleName());
		token.setCreatedByUser(resolveOptionalUser(adminEmail));
		token.setExpiresAt(now.plus(CLAIM_CODE_EXPIRY_DAYS, ChronoUnit.DAYS));

		return toResponse(staffClaimTokenRepository.save(token));
	}

	@Transactional(readOnly = true)
	public Optional<StaffClaimResponse> latestForStaff(UUID staffId) {
		if (!staffRepository.existsById(staffId)) {
			throw new ApiException(HttpStatus.NOT_FOUND, "Staff profile was not found.");
		}
		return staffClaimTokenRepository.findTopByStaffIdOrderByCreatedAtDesc(staffId)
			.map(this::toResponse);
	}

	@Transactional
	public AuthResponse claim(String code, String signedInEmail) {
		User user = userRepository.findByEmailIgnoreCase(normalizeEmail(signedInEmail))
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Signed-in user was not found."));
		StaffClaimToken token = staffClaimTokenRepository.findByClaimCodeIgnoreCase(code.trim())
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid staff claim code."));

		if (token.isUsed()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Staff claim code has already been used.");
		}
		if (Instant.now().isAfter(token.getExpiresAt())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Staff claim code has expired.");
		}
		if (!normalizeEmail(token.getTargetEmail()).equals(normalizeEmail(user.getEmail()))) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "This code is not assigned to your Gmail account.");
		}

		Staff staff = token.getStaff();
		if (staff.getUser() != null && !staff.getUser().getId().equals(user.getId())) {
			throw new ApiException(HttpStatus.CONFLICT, "This staff profile is already linked to another account.");
		}

		Role role = roleRepository.findByName(token.getRoleName())
			.orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Staff role is missing."));

		staff.setUser(user);
		user.getRoles().removeIf(existingRole -> shouldReplaceRole(user, existingRole.getName()));
		user.getRoles().add(role);
		token.setUsed(true);
		token.setUsedByUser(user);
		token.setUsedAt(Instant.now());
		token.setExpiresAt(token.getUsedAt());

		staffRepository.save(staff);
		userRepository.save(user);
		staffClaimTokenRepository.save(token);

		return authService.issueTokens(user);
	}

	private User resolveOptionalUser(String email) {
		if (email == null || email.isBlank()) {
			return null;
		}
		return userRepository.findByEmailIgnoreCase(normalizeEmail(email)).orElse(null);
	}

	private void expireOpenCodes(UUID staffId, Instant now) {
		var openTokens = staffClaimTokenRepository.findByStaffIdAndUsedFalse(staffId);
		openTokens.stream()
			.filter(token -> token.getExpiresAt().isAfter(now))
			.forEach(token -> token.setExpiresAt(now));
		staffClaimTokenRepository.saveAll(openTokens);
	}

	private String generateUniqueCode() {
		String code;
		do {
			code = "CLM-" + randomCodeSuffix();
		} while (staffClaimTokenRepository.existsByClaimCodeIgnoreCase(code));
		return code;
	}

	private String randomCodeSuffix() {
		StringBuilder builder = new StringBuilder(CLAIM_CODE_LENGTH);
		for (int index = 0; index < CLAIM_CODE_LENGTH; index++) {
			builder.append(CLAIM_CODE_CHARS[secureRandom.nextInt(CLAIM_CODE_CHARS.length)]);
		}
		return builder.toString();
	}

	private StaffClaimResponse toResponse(StaffClaimToken token) {
		Staff staff = token.getStaff();
		return new StaffClaimResponse(
			token.getId(),
			staff.getId(),
			staff.getStaffCode(),
			staff.getFirstName() + " " + staff.getLastName(),
			token.getClaimCode(),
			token.getTargetEmail(),
			token.getRoleName(),
			token.getCreatedAt(),
			token.getExpiresAt(),
			token.isUsed(),
			token.getUsedAt(),
			claimStatus(token)
		);
	}

	private String claimStatus(StaffClaimToken token) {
		if (token.isUsed()) {
			return "CLAIMED";
		}
		if (Instant.now().isAfter(token.getExpiresAt())) {
			return "EXPIRED";
		}
		return "PENDING";
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

	private boolean shouldReplaceRole(User user, String roleName) {
		if (isProtectedAdminRole(user, roleName)) {
			return false;
		}
		return STAFF_ROLE_NAMES.contains(roleName) || PATIENT_ROLE_NAME.equals(roleName);
	}

	private boolean isProtectedAdminRole(User user, String roleName) {
		return ADMIN_ROLE_NAME.equals(roleName) && normalizeEmail(user.getEmail()).equals(adminGoogleEmail);
	}
}
