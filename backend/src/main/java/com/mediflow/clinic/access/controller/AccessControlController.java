package com.mediflow.clinic.access.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.access.dto.AccountStatusRequest;
import com.mediflow.clinic.access.dto.PasswordResetRequest;
import com.mediflow.clinic.access.dto.PermissionResponse;
import com.mediflow.clinic.access.dto.RoleResponse;
import com.mediflow.clinic.access.dto.RoleUpdateRequest;
import com.mediflow.clinic.access.dto.UserAccessResponse;
import com.mediflow.clinic.access.service.AccessControlService;

@RestController
@RequestMapping("/api/access-control")
@PreAuthorize("hasRole('ADMIN')")
public class AccessControlController {

	private final AccessControlService accessControlService;

	public AccessControlController(AccessControlService accessControlService) {
		this.accessControlService = accessControlService;
	}

	@GetMapping("/users")
	public Page<UserAccessResponse> users(
		@RequestParam(required = false) String search,
		@PageableDefault(size = 20, sort = "createdAt") Pageable pageable
	) {
		return accessControlService.findUsers(search, pageable);
	}

	@GetMapping("/roles")
	public List<RoleResponse> roles() {
		return accessControlService.findRoles();
	}

	@GetMapping("/permissions")
	public List<PermissionResponse> permissions() {
		return accessControlService.findPermissions();
	}

	@PatchMapping("/users/{id}/roles")
	public UserAccessResponse updateRoles(@PathVariable UUID id, @Valid @RequestBody RoleUpdateRequest request) {
		return accessControlService.updateUserRoles(id, request);
	}

	@PatchMapping("/users/{id}/status")
	public UserAccessResponse updateStatus(@PathVariable UUID id, @RequestBody AccountStatusRequest request) {
		return accessControlService.updateAccountStatus(id, request);
	}

	@PostMapping("/users/{id}/password-reset")
	public UserAccessResponse resetPassword(@PathVariable UUID id, @Valid @RequestBody PasswordResetRequest request) {
		return accessControlService.resetPassword(id, request);
	}
}
