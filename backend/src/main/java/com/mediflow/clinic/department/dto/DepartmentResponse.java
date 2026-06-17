package com.mediflow.clinic.department.dto;

import java.util.UUID;

import com.mediflow.clinic.department.entity.DepartmentStatus;

public record DepartmentResponse(
	UUID id,
	String name,
	String description,
	DepartmentStatus status
) {
}
