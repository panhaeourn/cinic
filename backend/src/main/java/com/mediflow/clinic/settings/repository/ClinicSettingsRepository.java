package com.mediflow.clinic.settings.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mediflow.clinic.settings.entity.ClinicSettings;

public interface ClinicSettingsRepository extends JpaRepository<ClinicSettings, String> {
}
