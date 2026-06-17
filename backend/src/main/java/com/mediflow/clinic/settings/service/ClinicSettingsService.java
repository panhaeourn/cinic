package com.mediflow.clinic.settings.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.audit.service.AuditService;
import com.mediflow.clinic.settings.dto.ClinicBrandResponse;
import com.mediflow.clinic.settings.dto.ClinicSettingsRequest;
import com.mediflow.clinic.settings.dto.ClinicSettingsResponse;
import com.mediflow.clinic.settings.entity.ClinicSettings;
import com.mediflow.clinic.settings.repository.ClinicSettingsRepository;

@Service
public class ClinicSettingsService {

	private final ClinicSettingsRepository clinicSettingsRepository;
	private final AuditService auditService;

	public ClinicSettingsService(ClinicSettingsRepository clinicSettingsRepository, AuditService auditService) {
		this.clinicSettingsRepository = clinicSettingsRepository;
		this.auditService = auditService;
	}

	@Transactional(readOnly = true)
	public ClinicSettingsResponse get() {
		return toResponse(findOrCreate());
	}

	@Transactional(readOnly = true)
	public ClinicBrandResponse getBrand() {
		ClinicSettings settings = findOrCreate();
		return new ClinicBrandResponse(
			settings.getClinicName(),
			settings.getLogoUrl(),
			settings.getCurrency(),
			settings.getInvoicePrefix(),
			settings.getBakongMerchantName(),
			settings.getBakongCurrency()
		);
	}

	@Transactional
	public ClinicSettingsResponse update(ClinicSettingsRequest request) {
		ClinicSettings settings = findOrCreate();
		settings.setClinicName(clean(request.clinicName()));
		settings.setLogoUrl(clean(request.logoUrl()));
		settings.setAddress(clean(request.address()));
		settings.setPhone(clean(request.phone()));
		settings.setEmail(clean(request.email()));
		settings.setCurrency(clean(request.currency()).toUpperCase());
		settings.setInvoicePrefix(clean(request.invoicePrefix()).toUpperCase());
		settings.setGoogleClientId(clean(request.googleClientId()));
		settings.setGoogleRedirectUri(clean(request.googleRedirectUri()));
		settings.setBakongAccountId(clean(request.bakongAccountId()));
		settings.setBakongMerchantName(clean(request.bakongMerchantName()));
		settings.setBakongMerchantCity(clean(request.bakongMerchantCity()));
		settings.setBakongAccountInformation(clean(request.bakongAccountInformation()));
		settings.setBakongCurrency(clean(request.bakongCurrency()).toUpperCase());
		settings.setNotificationsEnabled(request.notificationsEnabled());
		settings.setEmailNotifications(request.emailNotifications());
		settings.setSmsNotifications(request.smsNotifications());

		ClinicSettings saved = clinicSettingsRepository.save(settings);
		auditService.record("SETTINGS", "UPDATE", "ClinicSettings", saved.getId(), "Clinic settings updated");
		return toResponse(saved);
	}

	private ClinicSettings findOrCreate() {
		return clinicSettingsRepository.findById(ClinicSettings.DEFAULT_ID).orElseGet(() -> {
			ClinicSettings settings = new ClinicSettings();
			settings.setId(ClinicSettings.DEFAULT_ID);
			return clinicSettingsRepository.save(settings);
		});
	}

	private String clean(String value) {
		return value == null ? "" : value.trim();
	}

	private ClinicSettingsResponse toResponse(ClinicSettings settings) {
		return new ClinicSettingsResponse(
			settings.getClinicName(),
			settings.getLogoUrl(),
			settings.getAddress(),
			settings.getPhone(),
			settings.getEmail(),
			settings.getCurrency(),
			settings.getInvoicePrefix(),
			settings.getGoogleClientId(),
			settings.getGoogleRedirectUri(),
			settings.getBakongAccountId(),
			settings.getBakongMerchantName(),
			settings.getBakongMerchantCity(),
			settings.getBakongAccountInformation(),
			settings.getBakongCurrency(),
			settings.isNotificationsEnabled(),
			settings.isEmailNotifications(),
			settings.isSmsNotifications(),
			settings.getUpdatedAt()
		);
	}
}
