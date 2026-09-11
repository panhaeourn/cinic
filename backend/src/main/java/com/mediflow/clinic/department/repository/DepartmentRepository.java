package com.mediflow.clinic.department.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mediflow.clinic.department.entity.Department;
import com.mediflow.clinic.department.entity.DepartmentStatus;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {

	List<Department> findAllByStatusOrderByNameAsc(DepartmentStatus status);

	List<Department> findAllByOrderByNameAsc();

	Optional<Department> findByNameIgnoreCase(String name);
}
