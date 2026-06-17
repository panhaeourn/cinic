package com.mediflow.clinic.queue.entity;

import java.time.Instant;
import java.time.LocalDate;
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

import com.mediflow.clinic.appointment.entity.Appointment;
import com.mediflow.clinic.patient.entity.Patient;
import com.mediflow.clinic.staff.entity.Staff;

@Entity
@Table(name = "queue_tickets")
public class QueueTicket {

	@Id
	@GeneratedValue
	private UUID id;

	@Column(nullable = false)
	private LocalDate queueDate;

	@Column(nullable = false)
	private Integer queueNumber;

	@Column(nullable = false, unique = true, length = 24)
	private String queueCode;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "patient_id", nullable = false)
	private Patient patient;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "appointment_id")
	private Appointment appointment;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assigned_staff_id")
	private Staff assignedStaff;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private QueueStatus status = QueueStatus.WAITING;

	@Column(nullable = false)
	private Integer priority = 0;

	@Column(columnDefinition = "TEXT")
	private String notes;

	@Column(nullable = false)
	private Instant checkedInAt = Instant.now();

	private Instant calledAt;

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

	public LocalDate getQueueDate() {
		return queueDate;
	}

	public void setQueueDate(LocalDate queueDate) {
		this.queueDate = queueDate;
	}

	public Integer getQueueNumber() {
		return queueNumber;
	}

	public void setQueueNumber(Integer queueNumber) {
		this.queueNumber = queueNumber;
	}

	public String getQueueCode() {
		return queueCode;
	}

	public void setQueueCode(String queueCode) {
		this.queueCode = queueCode;
	}

	public Patient getPatient() {
		return patient;
	}

	public void setPatient(Patient patient) {
		this.patient = patient;
	}

	public Appointment getAppointment() {
		return appointment;
	}

	public void setAppointment(Appointment appointment) {
		this.appointment = appointment;
	}

	public Staff getAssignedStaff() {
		return assignedStaff;
	}

	public void setAssignedStaff(Staff assignedStaff) {
		this.assignedStaff = assignedStaff;
	}

	public QueueStatus getStatus() {
		return status;
	}

	public void setStatus(QueueStatus status) {
		this.status = status;
	}

	public Integer getPriority() {
		return priority;
	}

	public void setPriority(Integer priority) {
		this.priority = priority;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getCheckedInAt() {
		return checkedInAt;
	}

	public void setCheckedInAt(Instant checkedInAt) {
		this.checkedInAt = checkedInAt;
	}

	public Instant getCalledAt() {
		return calledAt;
	}

	public void setCalledAt(Instant calledAt) {
		this.calledAt = calledAt;
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
