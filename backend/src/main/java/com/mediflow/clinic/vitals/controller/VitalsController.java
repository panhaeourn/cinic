package com.mediflow.clinic.vitals.controller;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.vitals.dto.VitalsRequest;
import com.mediflow.clinic.vitals.dto.VitalsResponse;
import com.mediflow.clinic.vitals.service.VitalsService;

@RestController
@RequestMapping("/api/vitals")
public class VitalsController {

	private final VitalsService vitalsService;

	public VitalsController(VitalsService vitalsService) {
		this.vitalsService = vitalsService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('VITALS_CREATE') and hasAnyRole('ADMIN', 'NURSE')")
	public VitalsResponse create(@Valid @RequestBody VitalsRequest request) {
		return vitalsService.create(request);
	}

	@GetMapping
	@PreAuthorize("hasAuthority('VITALS_VIEW') and hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
	public Page<VitalsResponse> findAll(
		@RequestParam(required = false) String search,
		@RequestParam(required = false) UUID patientId,
		@RequestParam(required = false) UUID queueTicketId,
		@RequestParam(required = false) UUID encounterId,
		@PageableDefault(size = 30, sort = "recordedAt") Pageable pageable
	) {
		return vitalsService.findAll(search, patientId, queueTicketId, encounterId, pageable);
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAuthority('VITALS_VIEW') and hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
	public VitalsResponse findById(@PathVariable UUID id) {
		return vitalsService.findById(id);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasAuthority('VITALS_UPDATE') and hasAnyRole('ADMIN', 'NURSE')")
	public VitalsResponse update(@PathVariable UUID id, @Valid @RequestBody VitalsRequest request) {
		return vitalsService.update(id, request);
	}
}
