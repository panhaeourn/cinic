package com.mediflow.clinic.department.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.department.dto.DepartmentRequest;
import com.mediflow.clinic.department.dto.DepartmentResponse;
import com.mediflow.clinic.department.entity.DepartmentStatus;
import com.mediflow.clinic.department.service.DepartmentService;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

	private final DepartmentService departmentService;

	public DepartmentController(DepartmentService departmentService) {
		this.departmentService = departmentService;
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public List<DepartmentResponse> findActive() {
		return departmentService.findActive();
	}

	@GetMapping("/manage")
	@PreAuthorize("hasRole('ADMIN')")
	public List<DepartmentResponse> findAll() {
		return departmentService.findAll();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('ADMIN')")
	public DepartmentResponse create(@Valid @RequestBody DepartmentRequest request) {
		return departmentService.create(request);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public DepartmentResponse update(@PathVariable UUID id, @Valid @RequestBody DepartmentRequest request) {
		return departmentService.update(id, request);
	}

	@PatchMapping("/{id}/status")
	@PreAuthorize("hasRole('ADMIN')")
	public DepartmentResponse setStatus(@PathVariable UUID id, @RequestParam DepartmentStatus status) {
		return departmentService.setStatus(id, status);
	}
}
