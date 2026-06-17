package com.mediflow.clinic.encounter.controller;

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

import com.mediflow.clinic.encounter.dto.EncounterCompleteRequest;
import com.mediflow.clinic.encounter.dto.EncounterCreateRequest;
import com.mediflow.clinic.encounter.dto.EncounterResponse;
import com.mediflow.clinic.encounter.dto.EncounterUpdateRequest;
import com.mediflow.clinic.encounter.entity.EncounterStatus;
import com.mediflow.clinic.encounter.service.EncounterService;

@RestController
@RequestMapping("/api/encounters")
public class EncounterController {

	private final EncounterService encounterService;

	public EncounterController(EncounterService encounterService) {
		this.encounterService = encounterService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('ENCOUNTER_CREATE') and hasAnyRole('ADMIN', 'DOCTOR')")
	public EncounterResponse create(@Valid @RequestBody EncounterCreateRequest request) {
		return encounterService.create(request);
	}

	@GetMapping
	@PreAuthorize("hasAuthority('ENCOUNTER_VIEW') and hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
	public Page<EncounterResponse> findAll(
		@RequestParam(required = false) String search,
		@RequestParam(required = false) EncounterStatus status,
		@RequestParam(required = false) UUID patientId,
		@PageableDefault(size = 30, sort = "startedAt") Pageable pageable
	) {
		return encounterService.findAll(search, status, patientId, pageable);
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAuthority('ENCOUNTER_VIEW') and hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
	public EncounterResponse findById(@PathVariable UUID id) {
		return encounterService.findById(id);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasAuthority('ENCOUNTER_UPDATE') and hasAnyRole('ADMIN', 'DOCTOR')")
	public EncounterResponse update(@PathVariable UUID id, @Valid @RequestBody EncounterUpdateRequest request) {
		return encounterService.update(id, request);
	}

	@PostMapping("/{id}/complete")
	@PreAuthorize("hasAuthority('ENCOUNTER_COMPLETE') and hasAnyRole('ADMIN', 'DOCTOR')")
	public EncounterResponse complete(@PathVariable UUID id, @RequestBody(required = false) EncounterCompleteRequest request) {
		return encounterService.complete(id, request);
	}
}
