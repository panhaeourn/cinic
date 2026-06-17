package com.mediflow.clinic.staff.entity;

public enum StaffType {
	ADMIN("ADM", "ADMIN"),
	DOCTOR("DOC", "DOCTOR"),
	PHARMACIST("PHA", "PHARMACIST"),
	RECEPTIONIST_CASHIER("RCP", "RECEPTIONIST_CASHIER"),
	NURSE("NUR", "NURSE");

	private final String codePrefix;
	private final String defaultRoleName;

	StaffType(String codePrefix, String defaultRoleName) {
		this.codePrefix = codePrefix;
		this.defaultRoleName = defaultRoleName;
	}

	public String codePrefix() {
		return codePrefix;
	}

	public String defaultRoleName() {
		return defaultRoleName;
	}
}
