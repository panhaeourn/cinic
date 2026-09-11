package com.mediflow.clinic.department.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.audit.service.AuditService;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.department.dto.DepartmentRequest;
import com.mediflow.clinic.department.dto.DepartmentResponse;
import com.mediflow.clinic.department.entity.Department;
import com.mediflow.clinic.department.entity.DepartmentStatus;
import com.mediflow.clinic.department.repository.DepartmentRepository;

@Service
public class DepartmentService {

	private final DepartmentRepository departmentRepository;
	private final AuditService auditService;

	public DepartmentService(DepartmentRepository departmentRepository, AuditService auditService) {
		this.departmentRepository = departmentRepository;
		this.auditService = auditService;
	}

	@Transactional(readOnly = true)
	public List<DepartmentResponse> findAll() {
		return departmentRepository.findAllByOrderByNameAsc().stream()
			.map(this::toResponse)
			.toList();
	}

	@Transactional
	public DepartmentResponse create(DepartmentRequest request) {
		String name = request.name().trim();
		ensureUniqueName(name, null);
		Department department = new Department();
		apply(department, request, name);
		Department saved = departmentRepository.save(department);
		auditService.record("DEPARTMENTS", "CREATE", "Department", saved.getId().toString(), saved.getName());
		return toResponse(saved);
	}

	@Transactional
	public DepartmentResponse update(UUID id, DepartmentRequest request) {
		Department department = findDepartment(id);
		String name = request.name().trim();
		ensureUniqueName(name, id);
		apply(department, request, name);
		Department saved = departmentRepository.save(department);
		auditService.record("DEPARTMENTS", "UPDATE", "Department", saved.getId().toString(), saved.getName());
		return toResponse(saved);
	}

	@Transactional
	public DepartmentResponse setStatus(UUID id, DepartmentStatus status) {
		Department department = findDepartment(id);
		department.setStatus(status);
		Department saved = departmentRepository.save(department);
		auditService.record("DEPARTMENTS", "STATUS_CHANGE", "Department", saved.getId().toString(), status.name());
		return toResponse(saved);
	}

	private void ensureUniqueName(String name, UUID currentId) {
		departmentRepository.findByNameIgnoreCase(name)
			.filter(existing -> currentId == null || !existing.getId().equals(currentId))
			.ifPresent(existing -> {
				throw new ApiException(HttpStatus.CONFLICT, "A department with this name already exists.");
			});
	}

	private Department findDepartment(UUID id) {
		return departmentRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Department was not found."));
	}

	private void apply(Department department, DepartmentRequest request, String name) {
		department.setName(name);
		String description = request.description() == null ? null : request.description().trim();
		department.setDescription(description == null || description.isBlank() ? null : description);
		department.setStatus(request.status() == null ? DepartmentStatus.ACTIVE : request.status());
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
