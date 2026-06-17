package com.mediflow.clinic.user.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mediflow.clinic.user.entity.Permission;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {

	List<Permission> findByCodeIn(Collection<String> codes);

	Optional<Permission> findByCode(String code);
}
