package com.mediflow.clinic.user.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.mediflow.clinic.user.entity.User;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

	boolean existsByEmailIgnoreCase(String email);

	@EntityGraph(attributePaths = {"roles", "roles.permissions"})
	Optional<User> findByEmailIgnoreCase(String email);
}
