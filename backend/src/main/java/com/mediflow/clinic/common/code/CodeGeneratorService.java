package com.mediflow.clinic.common.code;

import java.time.Clock;
import java.time.Year;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.settings.entity.ClinicSettings;
import com.mediflow.clinic.settings.repository.ClinicSettingsRepository;

@Service
public class CodeGeneratorService {

	private static final String PATIENT_CODE_TYPE = "PATIENT";
	private static final String INVOICE_CODE_TYPE = "INVOICE";
	private static final String PAYMENT_CODE_TYPE = "PAYMENT";
	private final CodeSequenceRepository codeSequenceRepository;
	private final ClinicSettingsRepository clinicSettingsRepository;
	private final Clock clock;

	public CodeGeneratorService(
		CodeSequenceRepository codeSequenceRepository,
		ClinicSettingsRepository clinicSettingsRepository
	) {
		this.codeSequenceRepository = codeSequenceRepository;
		this.clinicSettingsRepository = clinicSettingsRepository;
		this.clock = Clock.systemUTC();
	}

	@Transactional(propagation = Propagation.MANDATORY)
	public String nextPatientCode() {
		return nextCode(PATIENT_CODE_TYPE, "P");
	}

	@Transactional(propagation = Propagation.MANDATORY)
	public String nextStaffCode(String staffType, String codePrefix) {
		return nextCode("STAFF_" + staffType, codePrefix);
	}

	@Transactional(propagation = Propagation.MANDATORY)
	public String nextInvoiceNumber() {
		return nextCode(INVOICE_CODE_TYPE, invoicePrefix());
	}

	@Transactional(propagation = Propagation.MANDATORY)
	public String nextPaymentNumber() {
		return nextCode(PAYMENT_CODE_TYPE, "PAY");
	}

	private String nextCode(String codeType, String codePrefix) {
		int year = Year.now(clock).getValue();
		CodeSequence sequence = codeSequenceRepository.findByCodeTypeAndSequenceYear(codeType, year)
			.orElseGet(() -> codeSequenceRepository.saveAndFlush(new CodeSequence(codeType, year)));
		int nextNumber = sequence.nextNumber();
		return codePrefix + year + String.format("%03d", nextNumber);
	}

	private String invoicePrefix() {
		return clinicSettingsRepository.findById(ClinicSettings.DEFAULT_ID)
			.map(ClinicSettings::getInvoicePrefix)
			.filter(prefix -> prefix != null && !prefix.isBlank())
			.map(String::trim)
			.map(String::toUpperCase)
			.orElse("INV");
	}
}
