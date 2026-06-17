package com.mediflow.clinic.encounter.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import com.mediflow.clinic.patient.entity.Patient;
import com.mediflow.clinic.queue.entity.QueueTicket;
import com.mediflow.clinic.staff.entity.Staff;

@Entity
@Table(name = "encounters")
public class Encounter {

	@Id
	@GeneratedValue
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "patient_id", nullable = false)
	private Patient patient;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "doctor_id")
	private Staff doctor;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "queue_ticket_id")
	private QueueTicket queueTicket;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private EncounterStatus status = EncounterStatus.IN_PROGRESS;

	@Column(columnDefinition = "TEXT")
	private String chiefComplaint;

	@Column(columnDefinition = "TEXT")
	private String symptoms;

	@Column(columnDefinition = "TEXT")
	private String diagnosis;

	@Column(columnDefinition = "TEXT")
	private String notes;

	@Column(nullable = false, updatable = false)
	private Instant startedAt = Instant.now();

	private Instant completedAt;

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

	public Staff getDoctor() {
		return doctor;
	}

	public void setDoctor(Staff doctor) {
		this.doctor = doctor;
	}

	public QueueTicket getQueueTicket() {
		return queueTicket;
	}

	public void setQueueTicket(QueueTicket queueTicket) {
		this.queueTicket = queueTicket;
	}

	public EncounterStatus getStatus() {
		return status;
	}

	public void setStatus(EncounterStatus status) {
		this.status = status;
	}

	public String getChiefComplaint() {
		return chiefComplaint;
	}

	public void setChiefComplaint(String chiefComplaint) {
		this.chiefComplaint = chiefComplaint;
	}

	public String getSymptoms() {
		return symptoms;
	}

	public void setSymptoms(String symptoms) {
		this.symptoms = symptoms;
	}

	public String getDiagnosis() {
		return diagnosis;
	}

	public void setDiagnosis(String diagnosis) {
		this.diagnosis = diagnosis;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getStartedAt() {
		return startedAt;
	}

	public Instant getCompletedAt() {
		return completedAt;
	}

	public void setCompletedAt(Instant completedAt) {
		this.completedAt = completedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
