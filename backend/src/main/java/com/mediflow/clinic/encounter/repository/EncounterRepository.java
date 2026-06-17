package com.mediflow.clinic.encounter.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.mediflow.clinic.encounter.entity.Encounter;

public interface EncounterRepository extends JpaRepository<Encounter, UUID>, JpaSpecificationExecutor<Encounter> {
}
