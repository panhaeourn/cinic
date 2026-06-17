package com.mediflow.clinic.department.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.department.dto.DepartmentResponse;
import com.mediflow.clinic.department.entity.Department;
import com.mediflow.clinic.department.entity.DepartmentStatus;
import com.mediflow.clinic.department.repository.DepartmentRepository;

@Service
public class DepartmentService {

	private final DepartmentRepository departmentRepository;

	public DepartmentService(DepartmentRepository departmentRepository) {
		this.departmentRepository = departmentRepository;
	}

	@Transactional(readOnly = true)
	public List<DepartmentResponse> findActive() {
		return departmentRepository.findAllByStatusOrderByNameAsc(DepartmentStatus.ACTIVE).stream()
			.map(this::toResponse)
			.toList();
	}

	private DepartmentResponse toResponse(Department department) {
		return new DepartmentResponse(
			department.getId(),
			department.getName(),
			department.getDescription(),
			department.getStatus()
		);
	}
}
