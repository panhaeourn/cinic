package com.mediflow.clinic.department.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.mediflow.clinic.department.entity.DepartmentStatus;

public record DepartmentRequest(
	@NotBlank(message = "Department name is required.")
	@Size(max = 120, message = "Department name must be 120 characters or fewer.")
	String name,

	@Size(max = 2000, message = "Description must be 2000 characters or fewer.")
	String description,

	DepartmentStatus status
) {
}
