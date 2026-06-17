package com.mediflow.clinic.staff.mapper;

import org.springframework.stereotype.Component;

import com.mediflow.clinic.department.entity.Department;
import com.mediflow.clinic.staff.dto.StaffCreateRequest;
import com.mediflow.clinic.staff.dto.StaffResponse;
import com.mediflow.clinic.staff.dto.StaffUpdateRequest;
import com.mediflow.clinic.staff.entity.Staff;
import com.mediflow.clinic.staff.entity.StaffType;
import com.mediflow.clinic.user.entity.User;

@Component
public class StaffMapper {

	public Staff toEntity(StaffCreateRequest request, User user, Department department, String roleName) {
		Staff staff = new Staff();
		apply(staff, request, user, department, roleName);
		return staff;
	}

	public void updateEntity(Staff staff, StaffUpdateRequest request, User user, Department department, String roleName) {
		staff.setUser(user);
		staff.setFirstName(request.firstName().trim());
		staff.setLastName(request.lastName().trim());
		staff.setGender(request.gender());
		staff.setPhone(request.phone().trim());
		staff.setEmail(request.email().trim().toLowerCase());
		staff.setStaffType(request.staffType());
		staff.setRoleName(roleName);
		staff.setDepartment(department);
		staff.setStatus(request.status());
	}

	public StaffResponse toResponse(Staff staff) {
		Department department = staff.getDepartment();
		User user = staff.getUser();
		return new StaffResponse(
			staff.getId(),
			staff.getStaffCode(),
			user == null ? null : user.getId(),
			staff.getFirstName(),
			staff.getLastName(),
			staff.getFirstName() + " " + staff.getLastName(),
			staff.getGender(),
			staff.getPhone(),
			staff.getEmail(),
			staff.getStaffType(),
			staff.getRoleName(),
			department == null ? null : department.getId(),
			department == null ? null : department.getName(),
			staff.getStatus(),
			staff.getCreatedAt(),
			staff.getUpdatedAt()
		);
	}

	private void apply(Staff staff, StaffCreateRequest request, User user, Department department, String roleName) {
		StaffType staffType = request.staffType();
		staff.setUser(user);
		staff.setFirstName(request.firstName().trim());
		staff.setLastName(request.lastName().trim());
		staff.setGender(request.gender());
		staff.setPhone(request.phone().trim());
		staff.setEmail(request.email().trim().toLowerCase());
		staff.setStaffType(staffType);
		staff.setRoleName(roleName);
		staff.setDepartment(department);
		staff.setStatus(request.status());
	}
}
