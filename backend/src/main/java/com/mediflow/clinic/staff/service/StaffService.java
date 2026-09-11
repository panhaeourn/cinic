package com.mediflow.clinic.staff.service;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.common.code.CodeGeneratorService;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.department.entity.Department;
import com.mediflow.clinic.department.entity.DepartmentStatus;
import com.mediflow.clinic.department.repository.DepartmentRepository;
import com.mediflow.clinic.staff.dto.StaffCreateRequest;
import com.mediflow.clinic.staff.dto.StaffResponse;
import com.mediflow.clinic.staff.dto.StaffUpdateRequest;
import com.mediflow.clinic.staff.entity.Staff;
import com.mediflow.clinic.staff.mapper.StaffMapper;
import com.mediflow.clinic.staff.repository.StaffRepository;
import com.mediflow.clinic.user.entity.Role;
import com.mediflow.clinic.user.entity.User;
import com.mediflow.clinic.user.repository.RoleRepository;
import com.mediflow.clinic.user.repository.UserRepository;

@Service
public class StaffService {

	private static final String PATIENT_ROLE_NAME = "PATIENT";
	private static final String ADMIN_ROLE_NAME = "ADMIN";
	private static final Set<String> STAFF_ROLE_NAMES = Set.of(
		ADMIN_ROLE_NAME,
		"DOCTOR",
		"PHARMACIST",
		"RECEPTIONIST_CASHIER",
		"NURSE"
	);

	private final String adminGoogleEmail;
	private final StaffRepository staffRepository;
	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final DepartmentRepository departmentRepository;
	private final StaffMapper staffMapper;
	private final CodeGeneratorService codeGeneratorService;

	public StaffService(
		@Value("${app.security.admin-google-email}") String adminGoogleEmail,
		StaffRepository staffRepository,
		UserRepository userRepository,
		RoleRepository roleRepository,
		DepartmentRepository departmentRepository,
		StaffMapper staffMapper,
		CodeGeneratorService codeGeneratorService
	) {
		this.adminGoogleEmail = normalizeEmail(adminGoogleEmail);
		this.staffRepository = staffRepository;
		this.userRepository = userRepository;
		this.roleRepository = roleRepository;
		this.departmentRepository = departmentRepository;
		this.staffMapper = staffMapper;
		this.codeGeneratorService = codeGeneratorService;
	}

	@Transactional
	public StaffResponse create(StaffCreateRequest request) {
		String email = normalizeEmail(request.email());
		if (staffRepository.existsByEmailIgnoreCase(email)) {
			throw new ApiException(HttpStatus.CONFLICT, "A staff profile already exists with this email.");
		}

		User user = resolveUser(request.userId());
		Department department = resolveDepartment(request.departmentId());
		Role role = resolveRole(resolveStaffRoleName(request.roleName(), request.staffType().defaultRoleName()));
		Staff staff = staffMapper.toEntity(request, user, department, role.getName());
		staff.setStaffCode(codeGeneratorService.nextStaffCode(request.staffType().name(), request.staffType().codePrefix()));
		assignLinkedUserRole(user, role);
		return staffMapper.toResponse(staffRepository.save(staff));
	}

	@Transactional(readOnly = true)
	public Page<StaffResponse> findAll(String search, Pageable pageable) {
		String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
		if (normalizedSearch == null) {
			return staffRepository.findAll(pageable).map(staffMapper::toResponse);
		}
		return staffRepository.findAll(searchSpec(normalizedSearch), pageable).map(staffMapper::toResponse);
	}

	@Transactional(readOnly = true)
	public StaffResponse findById(UUID id) {
		return staffMapper.toResponse(findStaff(id));
	}

	@Transactional
	public StaffResponse update(UUID id, StaffUpdateRequest request) {
		Staff staff = findStaff(id);
		String email = normalizeEmail(request.email());
		if (staffRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
			throw new ApiException(HttpStatus.CONFLICT, "A staff profile already exists with this email.");
		}

		User user = resolveUser(request.userId());
		Department department = resolveDepartment(request.departmentId());
		Role role = resolveRole(resolveStaffRoleName(request.roleName(), request.staffType().defaultRoleName()));
		staffMapper.updateEntity(staff, request, user, department, role.getName());
		assignLinkedUserRole(user, role);
		return staffMapper.toResponse(staffRepository.save(staff));
	}

	@Transactional
	public void delete(UUID id) {
		Staff staff = findStaff(id);
		revokeLinkedStaffAccess(staff.getUser(), staff.getRoleName());
		staffRepository.delete(staff);
	}

	private Staff findStaff(UUID id) {
		return staffRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Staff profile was not found."));
	}

	private User resolveUser(UUID userId) {
		if (userId == null) {
			return null;
		}
		return userRepository.findById(userId)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Linked user was not found."));
	}

	private Department resolveDepartment(UUID departmentId) {
		if (departmentId == null) {
			return null;
		}
		return departmentRepository.findById(departmentId)
			.filter(department -> department.getStatus() == DepartmentStatus.ACTIVE)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "An active department was not found."));
	}

	private Role resolveRole(String roleName) {
		return roleRepository.findByName(roleName)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Role was not found."));
	}

	private void assignLinkedUserRole(User user, Role role) {
		if (user == null) {
			return;
		}
		user.getRoles().removeIf(existingRole -> shouldReplaceRole(user, existingRole.getName()));
		user.getRoles().add(role);
		userRepository.save(user);
	}

	private void revokeLinkedStaffAccess(User user, String staffRoleName) {
		if (user == null) {
			return;
		}
		user.getRoles().removeIf(role -> role.getName().equals(staffRoleName) && !isProtectedAdminRole(user, role.getName()));
		if (user.getRoles().isEmpty()) {
			Role patientRole = roleRepository.findByName(PATIENT_ROLE_NAME)
				.orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Patient role is missing."));
			user.getRoles().add(patientRole);
		}
		userRepository.save(user);
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

	private String resolveStaffRoleName(String requestedRoleName, String defaultRoleName) {
		if (requestedRoleName == null || requestedRoleName.isBlank()) {
			return defaultRoleName;
		}
		String normalizedRoleName = requestedRoleName.trim().toUpperCase(Locale.ROOT);
		if (!normalizedRoleName.equals(defaultRoleName)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Role must match the selected staff type.");
		}
		return defaultRoleName;
	}

	private boolean shouldReplaceRole(User user, String roleName) {
		if (isProtectedAdminRole(user, roleName)) {
			return false;
		}
		return STAFF_ROLE_NAMES.contains(roleName) || PATIENT_ROLE_NAME.equals(roleName);
	}

	private boolean isProtectedAdminRole(User user, String roleName) {
		return ADMIN_ROLE_NAME.equals(roleName) && normalizeEmail(user.getEmail()).equals(adminGoogleEmail);
	}

	private Specification<Staff> searchSpec(String search) {
		return (root, query, criteriaBuilder) -> {
			String pattern = "%" + search.toLowerCase(Locale.ROOT) + "%";
			return criteriaBuilder.or(
				criteriaBuilder.like(criteriaBuilder.lower(root.get("staffCode")), pattern),
				criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), pattern),
				criteriaBuilder.like(criteriaBuilder.lower(root.get("lastName")), pattern),
				criteriaBuilder.like(criteriaBuilder.lower(root.get("phone")), pattern),
				criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern),
				criteriaBuilder.like(criteriaBuilder.lower(root.get("roleName")), pattern)
			);
		};
	}
}
