package com.mediflow.clinic.patient.controller;

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

import com.mediflow.clinic.patient.dto.PatientCreateRequest;
import com.mediflow.clinic.patient.dto.PatientResponse;
import com.mediflow.clinic.patient.dto.PatientUpdateRequest;
import com.mediflow.clinic.patient.dto.PatientListItemResponse;
import com.mediflow.clinic.patient.service.PatientService;
import com.mediflow.clinic.common.response.CursorPageResponse;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

	private final PatientService patientService;

	public PatientController(PatientService patientService) {
		this.patientService = patientService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('PATIENT_CREATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public PatientResponse create(@Valid @RequestBody PatientCreateRequest request) {
		return patientService.create(request);
	}

	@GetMapping
	@PreAuthorize("hasAuthority('PATIENT_VIEW') and hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST_CASHIER', 'NURSE')")
	public Page<PatientResponse> findAll(
		@RequestParam(required = false) String search,
		@PageableDefault(size = 20, sort = "createdAt") Pageable pageable
	) {
		return patientService.findAll(search, pageable);
	}

	@GetMapping("/cursor")
	@PreAuthorize("hasAuthority('PATIENT_VIEW') and hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST_CASHIER', 'NURSE')")
	public CursorPageResponse<PatientListItemResponse> findCursor(
		@RequestParam(required = false) String search,
		@RequestParam(required = false) String cursor,
		@RequestParam(defaultValue = "50") int size
	) {
		return patientService.findCursor(search, cursor, size);
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAuthority('PATIENT_VIEW') and hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST_CASHIER', 'NURSE')")
	public PatientResponse findById(@PathVariable UUID id) {
		return patientService.findById(id);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasAuthority('PATIENT_UPDATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public PatientResponse update(@PathVariable UUID id, @Valid @RequestBody PatientUpdateRequest request) {
		return patientService.update(id, request);
	}
}
