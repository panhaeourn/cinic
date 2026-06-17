package com.mediflow.clinic.vitals.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import com.mediflow.clinic.encounter.entity.Encounter;
import com.mediflow.clinic.patient.entity.Patient;
import com.mediflow.clinic.queue.entity.QueueTicket;
import com.mediflow.clinic.staff.entity.Staff;

@Entity
@Table(name = "vitals")
public class Vitals {

	@Id
	@GeneratedValue
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "patient_id", nullable = false)
	private Patient patient;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "queue_ticket_id")
	private QueueTicket queueTicket;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "encounter_id")
	private Encounter encounter;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "nurse_id")
	private Staff nurse;

	@Column(name = "systolic_bp")
	private Integer systolicBp;

	@Column(name = "diastolic_bp")
	private Integer diastolicBp;

	@Column(name = "temperature_c", precision = 5, scale = 2)
	private BigDecimal temperatureC;

	@Column(name = "oxygen_saturation")
	private Integer oxygenSaturation;

	@Column(name = "heart_rate")
	private Integer heartRate;

	@Column(name = "weight_kg", precision = 6, scale = 2)
	private BigDecimal weightKg;

	@Column(name = "height_cm", precision = 6, scale = 2)
	private BigDecimal heightCm;

	@Column(columnDefinition = "TEXT")
	private String notes;

	@Column(nullable = false)
	private Instant recordedAt = Instant.now();

	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(nullable = false)
	private Instant updatedAt = Instant.now();

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public Patient getPatient() {
		return patient;
	}

	public void setPatient(Patient patient) {
		this.patient = patient;
	}

	public QueueTicket getQueueTicket() {
		return queueTicket;
	}

	public void setQueueTicket(QueueTicket queueTicket) {
		this.queueTicket = queueTicket;
	}

	public Encounter getEncounter() {
		return encounter;
	}

	public void setEncounter(Encounter encounter) {
		this.encounter = encounter;
	}

	public Staff getNurse() {
		return nurse;
	}

	public void setNurse(Staff nurse) {
		this.nurse = nurse;
	}

	public Integer getSystolicBp() {
		return systolicBp;
	}

	public void setSystolicBp(Integer systolicBp) {
		this.systolicBp = systolicBp;
	}

	public Integer getDiastolicBp() {
		return diastolicBp;
	}

	public void setDiastolicBp(Integer diastolicBp) {
		this.diastolicBp = diastolicBp;
	}

	public BigDecimal getTemperatureC() {
		return temperatureC;
	}

	public void setTemperatureC(BigDecimal temperatureC) {
		this.temperatureC = temperatureC;
	}

	public Integer getOxygenSaturation() {
		return oxygenSaturation;
	}

	public void setOxygenSaturation(Integer oxygenSaturation) {
		this.oxygenSaturation = oxygenSaturation;
	}

	public Integer getHeartRate() {
		return heartRate;
	}

	public void setHeartRate(Integer heartRate) {
		this.heartRate = heartRate;
	}

	public BigDecimal getWeightKg() {
		return weightKg;
	}

	public void setWeightKg(BigDecimal weightKg) {
		this.weightKg = weightKg;
	}

	public BigDecimal getHeightCm() {
		return heightCm;
	}

	public void setHeightCm(BigDecimal heightCm) {
		this.heightCm = heightCm;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getRecordedAt() {
		return recordedAt;
	}

	public void setRecordedAt(Instant recordedAt) {
		this.recordedAt = recordedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
