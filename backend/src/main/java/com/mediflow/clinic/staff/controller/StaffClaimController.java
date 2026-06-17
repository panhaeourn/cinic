package com.mediflow.clinic.staff.controller;

import java.security.Principal;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.auth.dto.AuthResponse;
import com.mediflow.clinic.staff.dto.StaffClaimGenerateRequest;
import com.mediflow.clinic.staff.dto.StaffClaimRequest;
import com.mediflow.clinic.staff.dto.StaffClaimResponse;
import com.mediflow.clinic.staff.service.StaffClaimService;

@RestController
@RequestMapping("/api/staff-claims")
public class StaffClaimController {

	private final StaffClaimService staffClaimService;

	public StaffClaimController(StaffClaimService staffClaimService) {
		this.staffClaimService = staffClaimService;
	}

	@PostMapping("/generate")
	@PreAuthorize("hasRole('ADMIN')")
	public StaffClaimResponse generate(@Valid @RequestBody StaffClaimGenerateRequest request, Principal principal) {
		return staffClaimService.generate(request.staffId(), principal.getName());
	}

	@GetMapping("/staff/{staffId}/latest")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<StaffClaimResponse> latestForStaff(@PathVariable UUID staffId) {
		return staffClaimService.latestForStaff(staffId)
			.map(ResponseEntity::ok)
			.orElseGet(() -> ResponseEntity.noContent().build());
	}

	@PostMapping("/claim")
	public AuthResponse claim(@Valid @RequestBody StaffClaimRequest request, Principal principal) {
		return staffClaimService.claim(request.code(), principal.getName());
	}
}
