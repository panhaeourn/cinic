package com.mediflow.clinic.settings.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "clinic_settings")
public class ClinicSettings {

	public static final String DEFAULT_ID = "DEFAULT";

	@Id
	@Column(length = 40)
	private String id = DEFAULT_ID;

	@Column(nullable = false, length = 160)
	private String clinicName = "MediFlex Clinic";

	@Column(columnDefinition = "TEXT")
	private String logoUrl = "";

	@Column(columnDefinition = "TEXT")
	private String address = "";

	@Column(length = 40)
	private String phone = "";

	@Column(length = 180)
	private String email = "";

	@Column(nullable = false, length = 8)
	private String currency = "USD";

	@Column(nullable = false, length = 12)
	private String invoicePrefix = "INV";

	@Column(length = 240)
	private String googleClientId = "";

	@Column(length = 240)
	private String googleRedirectUri = "";

	@Column(length = 120)
	private String bakongAccountId = "";

	@Column(length = 160)
	private String bakongMerchantName = "";

	@Column(length = 120)
	private String bakongMerchantCity = "Phnom Penh";

	@Column(length = 160)
	private String bakongAccountInformation = "";

	@Column(nullable = false, length = 8)
	private String bakongCurrency = "USD";

	@Column(nullable = false)
	private boolean notificationsEnabled = true;

	@Column(nullable = false)
	private boolean emailNotifications = true;

	@Column(nullable = false)
	private boolean smsNotifications = false;

	@Column(nullable = false)
	private Instant updatedAt = Instant.now();

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getClinicName() {
		return clinicName;
	}

	public void setClinicName(String clinicName) {
		this.clinicName = clinicName;
	}

	public String getLogoUrl() {
		return logoUrl;
	}

	public void setLogoUrl(String logoUrl) {
		this.logoUrl = logoUrl;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getCurrency() {
		return currency;
	}

	public void setCurrency(String currency) {
		this.currency = currency;
	}

	public String getInvoicePrefix() {
		return invoicePrefix;
	}

	public void setInvoicePrefix(String invoicePrefix) {
		this.invoicePrefix = invoicePrefix;
	}

	public String getGoogleClientId() {
		return googleClientId;
	}

	public void setGoogleClientId(String googleClientId) {
		this.googleClientId = googleClientId;
	}

	public String getGoogleRedirectUri() {
		return googleRedirectUri;
	}

	public void setGoogleRedirectUri(String googleRedirectUri) {
		this.googleRedirectUri = googleRedirectUri;
	}

	public String getBakongAccountId() {
		return bakongAccountId;
	}

	public void setBakongAccountId(String bakongAccountId) {
		this.bakongAccountId = bakongAccountId;
	}

	public String getBakongMerchantName() {
		return bakongMerchantName;
	}

	public void setBakongMerchantName(String bakongMerchantName) {
		this.bakongMerchantName = bakongMerchantName;
	}

	public String getBakongMerchantCity() {
		return bakongMerchantCity;
	}

	public void setBakongMerchantCity(String bakongMerchantCity) {
		this.bakongMerchantCity = bakongMerchantCity;
	}

	public String getBakongAccountInformation() {
		return bakongAccountInformation;
	}

	public void setBakongAccountInformation(String bakongAccountInformation) {
		this.bakongAccountInformation = bakongAccountInformation;
	}

	public String getBakongCurrency() {
		return bakongCurrency;
	}

	public void setBakongCurrency(String bakongCurrency) {
		this.bakongCurrency = bakongCurrency;
	}

	public boolean isNotificationsEnabled() {
		return notificationsEnabled;
	}

	public void setNotificationsEnabled(boolean notificationsEnabled) {
		this.notificationsEnabled = notificationsEnabled;
	}

	public boolean isEmailNotifications() {
		return emailNotifications;
	}

	public void setEmailNotifications(boolean emailNotifications) {
		this.emailNotifications = emailNotifications;
	}

	public boolean isSmsNotifications() {
		return smsNotifications;
	}

	public void setSmsNotifications(boolean smsNotifications) {
		this.smsNotifications = smsNotifications;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
