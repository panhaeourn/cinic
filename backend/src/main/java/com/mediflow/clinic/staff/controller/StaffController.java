package com.mediflow.clinic.staff.controller;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.staff.dto.StaffCreateRequest;
import com.mediflow.clinic.staff.dto.StaffResponse;
import com.mediflow.clinic.staff.dto.StaffUpdateRequest;
import com.mediflow.clinic.staff.service.StaffService;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

	private final StaffService staffService;

	public StaffController(StaffService staffService) {
		this.staffService = staffService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('ADMIN')")
	public StaffResponse create(@Valid @RequestBody StaffCreateRequest request) {
		return staffService.create(request);
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public Page<StaffResponse> findAll(
		@RequestParam(required = false) String search,
		@PageableDefault(size = 20, sort = "createdAt") Pageable pageable
	) {
		return staffService.findAll(search, pageable);
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public StaffResponse findById(@PathVariable UUID id) {
		return staffService.findById(id);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public StaffResponse update(@PathVariable UUID id, @Valid @RequestBody StaffUpdateRequest request) {
		return staffService.update(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasRole('ADMIN')")
	public void delete(@PathVariable UUID id) {
		staffService.delete(id);
	}
}
