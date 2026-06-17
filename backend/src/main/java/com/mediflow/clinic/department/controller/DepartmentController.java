package com.mediflow.clinic.department.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.department.dto.DepartmentResponse;
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
}
