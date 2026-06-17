package com.mediflow.clinic.vitals.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.mediflow.clinic.vitals.entity.Vitals;

public interface VitalsRepository extends JpaRepository<Vitals, UUID>, JpaSpecificationExecutor<Vitals> {
}
