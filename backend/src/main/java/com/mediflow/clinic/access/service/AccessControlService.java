package com.mediflow.clinic.access.service;

import java.util.Comparator;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.access.dto.AccountStatusRequest;
import com.mediflow.clinic.access.dto.PasswordResetRequest;
import com.mediflow.clinic.access.dto.PermissionResponse;
import com.mediflow.clinic.access.dto.RoleResponse;
import com.mediflow.clinic.access.dto.RoleUpdateRequest;
import com.mediflow.clinic.access.dto.UserAccessResponse;
import com.mediflow.clinic.audit.service.AuditService;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.user.entity.Permission;
import com.mediflow.clinic.user.entity.Role;
import com.mediflow.clinic.user.entity.User;
import com.mediflow.clinic.user.repository.PermissionRepository;
import com.mediflow.clinic.user.repository.RoleRepository;
import com.mediflow.clinic.user.repository.UserRepository;

@Service
public class AccessControlService {

	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final PermissionRepository permissionRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuditService auditService;

	public AccessControlService(
		UserRepository userRepository,
		RoleRepository roleRepository,
		PermissionRepository permissionRepository,
		PasswordEncoder passwordEncoder,
		AuditService auditService
	) {
		this.userRepository = userRepository;
		this.roleRepository = roleRepository;
		this.permissionRepository = permissionRepository;
		this.passwordEncoder = passwordEncoder;
		this.auditService = auditService;
	}

	@Transactional(readOnly = true)
	public Page<UserAccessResponse> findUsers(String search, Pageable pageable) {
		return userRepository.findAll(userSearch(search), pageable).map(this::toUserResponse);
	}

	@Transactional(readOnly = true)
	public java.util.List<RoleResponse> findRoles() {
		return roleRepository.findAll()
			.stream()
			.sorted(Comparator.comparing(Role::getName))
			.map(this::toRoleResponse)
			.toList();
	}

	@Transactional(readOnly = true)
	public java.util.List<PermissionResponse> findPermissions() {
		return permissionRepository.findAll()
			.stream()
			.sorted(Comparator.comparing(Permission::getCode))
			.map(this::toPermissionResponse)
			.toList();
	}

	@Transactional
	public UserAccessResponse updateUserRoles(UUID userId, RoleUpdateRequest request) {
		User user = findUser(userId);
		Set<String> requestedRoles = request.roles()
			.stream()
			.map(role -> role.trim().toUpperCase(Locale.ROOT))
			.filter(role -> !role.isBlank())
			.collect(java.util.stream.Collectors.toSet());
		java.util.List<Role> roles = roleRepository.findAll()
			.stream()
			.filter(role -> requestedRoles.contains(role.getName()))
			.toList();
		if (roles.size() != requestedRoles.size()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "One or more requested roles do not exist.");
		}
		if (roles.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "User must keep at least one role.");
		}
		user.getRoles().clear();
		user.getRoles().addAll(roles);
		User saved = userRepository.save(user);
		auditService.record("ACCESS_CONTROL", "ROLES_UPDATED", "User", userId.toString(), "Updated roles for " + saved.getEmail());
		return toUserResponse(saved);
	}

	@Transactional
	public UserAccessResponse updateAccountStatus(UUID userId, AccountStatusRequest request) {
		User user = findUser(userId);
		user.setEnabled(request.enabled());
		user.setAccountNonLocked(request.accountNonLocked());
		User saved = userRepository.save(user);
		auditService.record("ACCESS_CONTROL", "ACCOUNT_STATUS_UPDATED", "User", userId.toString(), "Updated account status for " + saved.getEmail());
		return toUserResponse(saved);
	}

	@Transactional
	public UserAccessResponse resetPassword(UUID userId, PasswordResetRequest request) {
		User user = findUser(userId);
		user.setPasswordHash(passwordEncoder.encode(request.temporaryPassword()));
		user.setCredentialsNonExpired(true);
		User saved = userRepository.save(user);
		auditService.record("ACCESS_CONTROL", "PASSWORD_RESET", "User", userId.toString(), "Reset password for " + saved.getEmail());
		return toUserResponse(saved);
	}

	private User findUser(UUID id) {
		return userRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User was not found."));
	}

	private Specification<User> userSearch(String search) {
		return (root, query, cb) -> {
			if (search == null || search.isBlank()) {
				return cb.conjunction();
			}
			String pattern = "%" + search.toLowerCase(Locale.ROOT).trim() + "%";
			return cb.or(
				cb.like(cb.lower(root.get("email")), pattern),
				cb.like(cb.lower(root.get("fullName")), pattern),
				cb.like(cb.lower(root.get("phoneNumber")), pattern)
			);
		};
	}

	private UserAccessResponse toUserResponse(User user) {
		return new UserAccessResponse(
			user.getId(),
			user.getEmail(),
			user.getFullName(),
			user.getPhoneNumber(),
			user.isEnabled(),
			user.isAccountNonLocked(),
			user.isCredentialsNonExpired(),
			user.getRoles().stream().map(Role::getName).sorted().toList(),
			user.getCreatedAt(),
			user.getUpdatedAt()
		);
	}

	private RoleResponse toRoleResponse(Role role) {
		return new RoleResponse(
			role.getId(),
			role.getName(),
			role.getDescription(),
			role.getPermissions().stream().map(this::toPermissionResponse).sorted(Comparator.comparing(PermissionResponse::code)).toList()
		);
	}

	private PermissionResponse toPermissionResponse(Permission permission) {
		return new PermissionResponse(permission.getId(), permission.getCode(), permission.getDescription());
	}
}
