package com.mediflow.clinic.settings.controller;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.settings.dto.ClinicBrandResponse;
import com.mediflow.clinic.settings.dto.ClinicSettingsRequest;
import com.mediflow.clinic.settings.dto.ClinicSettingsResponse;
import com.mediflow.clinic.settings.service.ClinicSettingsService;

@RestController
@RequestMapping("/api/settings")
public class ClinicSettingsController {

	private final ClinicSettingsService clinicSettingsService;

	public ClinicSettingsController(ClinicSettingsService clinicSettingsService) {
		this.clinicSettingsService = clinicSettingsService;
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ClinicSettingsResponse get() {
		return clinicSettingsService.get();
	}

	@GetMapping("/brand")
	public ClinicBrandResponse brand() {
		return clinicSettingsService.getBrand();
	}

	@PutMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ClinicSettingsResponse update(@Valid @RequestBody ClinicSettingsRequest request) {
		return clinicSettingsService.update(request);
	}
}
