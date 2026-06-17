package com.mediflow.clinic.queue.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.appointment.entity.Appointment;
import com.mediflow.clinic.appointment.entity.AppointmentStatus;
import com.mediflow.clinic.appointment.repository.AppointmentRepository;
import com.mediflow.clinic.audit.service.AuditService;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.patient.entity.Patient;
import com.mediflow.clinic.patient.repository.PatientRepository;
import com.mediflow.clinic.queue.dto.QueueCheckInRequest;
import com.mediflow.clinic.queue.dto.QueueStatusUpdateRequest;
import com.mediflow.clinic.queue.dto.QueueTicketResponse;
import com.mediflow.clinic.queue.entity.QueueStatus;
import com.mediflow.clinic.queue.entity.QueueTicket;
import com.mediflow.clinic.queue.repository.QueueTicketRepository;
import com.mediflow.clinic.staff.entity.Staff;
import com.mediflow.clinic.staff.repository.StaffRepository;

@Service
public class QueueService {

	private final QueueTicketRepository queueTicketRepository;
	private final PatientRepository patientRepository;
	private final AppointmentRepository appointmentRepository;
	private final StaffRepository staffRepository;
	private final AuditService auditService;
	private final Clock clock;

	public QueueService(
		QueueTicketRepository queueTicketRepository,
		PatientRepository patientRepository,
		AppointmentRepository appointmentRepository,
		StaffRepository staffRepository,
		AuditService auditService
	) {
		this.queueTicketRepository = queueTicketRepository;
		this.patientRepository = patientRepository;
		this.appointmentRepository = appointmentRepository;
		this.staffRepository = staffRepository;
		this.auditService = auditService;
		this.clock = Clock.systemUTC();
	}

	@Transactional
	public QueueTicketResponse checkIn(QueueCheckInRequest request) {
		Patient patient = findPatient(request.patientId());
		Appointment appointment = resolveAppointment(request.appointmentId());
		if (appointment != null && !appointment.getPatient().getId().equals(patient.getId())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Appointment belongs to another patient.");
		}

		LocalDate today = LocalDate.now(clock);
		int nextNumber = queueTicketRepository.findMaxQueueNumber(today) + 1;
		QueueTicket ticket = new QueueTicket();
		ticket.setPatient(patient);
		ticket.setAppointment(appointment);
		ticket.setAssignedStaff(resolveStaff(request.assignedStaffId()));
		ticket.setQueueDate(today);
		ticket.setQueueNumber(nextNumber);
		ticket.setQueueCode("Q" + today.toString().replace("-", "") + String.format("%03d", nextNumber));
		ticket.setPriority(request.priority() == null ? 0 : request.priority());
		ticket.setNotes(normalizeOptional(request.notes()));
		ticket.setCheckedInAt(Instant.now(clock));

		if (appointment != null) {
			appointment.setStatus(AppointmentStatus.CHECKED_IN);
		}

		QueueTicket saved = queueTicketRepository.save(ticket);
		auditService.record("QUEUE", "CHECK_IN", "QueueTicket", saved.getId().toString(), saved.getQueueCode());
		return toResponse(saved);
	}

	@Transactional(readOnly = true)
	public Page<QueueTicketResponse> findAll(String search, QueueStatus status, LocalDate date, Pageable pageable) {
		return queueTicketRepository.findAll(filters(search, status, date), pageable).map(this::toResponse);
	}

	@Transactional
	public QueueTicketResponse updateStatus(UUID id, QueueStatusUpdateRequest request) {
		QueueTicket ticket = findTicket(id);
		ticket.setStatus(request.status());
		ticket.setAssignedStaff(resolveStaff(request.assignedStaffId()));
		ticket.setNotes(mergeNotes(ticket.getNotes(), request.notes()));
		if (request.status() == QueueStatus.CALLED && ticket.getCalledAt() == null) {
			ticket.setCalledAt(Instant.now(clock));
		}
		if (request.status() == QueueStatus.COMPLETED) {
			ticket.setCompletedAt(Instant.now(clock));
			if (ticket.getAppointment() != null) {
				ticket.getAppointment().setStatus(AppointmentStatus.COMPLETED);
			}
		}
		QueueTicket saved = queueTicketRepository.save(ticket);
		auditService.record("QUEUE", "STATUS_CHANGE", "QueueTicket", saved.getId().toString(), saved.getStatus().name());
		return toResponse(saved);
	}

	private QueueTicket findTicket(UUID id) {
		return queueTicketRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Queue ticket was not found."));
	}

	private Patient findPatient(UUID id) {
		return patientRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Patient was not found."));
	}

	private Appointment resolveAppointment(UUID id) {
		if (id == null) {
			return null;
		}
		return appointmentRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Appointment was not found."));
	}

	private Staff resolveStaff(UUID id) {
		if (id == null) {
			return null;
		}
		return staffRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Staff member was not found."));
	}

	private QueueTicketResponse toResponse(QueueTicket ticket) {
		Patient patient = ticket.getPatient();
		Staff assignedStaff = ticket.getAssignedStaff();
		return new QueueTicketResponse(
			ticket.getId(),
			ticket.getQueueDate(),
			ticket.getQueueNumber(),
			ticket.getQueueCode(),
			patient.getId(),
			patient.getPatientCode(),
			patient.getFirstName() + " " + patient.getLastName(),
			ticket.getAppointment() == null ? null : ticket.getAppointment().getId(),
			assignedStaff == null ? null : assignedStaff.getId(),
			assignedStaff == null ? null : assignedStaff.getFirstName() + " " + assignedStaff.getLastName(),
			ticket.getStatus(),
			ticket.getPriority(),
			ticket.getNotes(),
			ticket.getCheckedInAt(),
			ticket.getCalledAt(),
			ticket.getCompletedAt(),
			ticket.getCreatedAt(),
			ticket.getUpdatedAt()
		);
	}

	private Specification<QueueTicket> filters(String search, QueueStatus status, LocalDate date) {
		return (root, query, cb) -> {
			if (query != null) {
				query.distinct(true);
			}
			var predicate = cb.conjunction();
			if (status != null) {
				predicate = cb.and(predicate, cb.equal(root.get("status"), status));
			}
			if (date != null) {
				predicate = cb.and(predicate, cb.equal(root.get("queueDate"), date));
			}
			if (search != null && !search.isBlank()) {
				String pattern = "%" + search.toLowerCase(Locale.ROOT).trim() + "%";
				Join<QueueTicket, Patient> patient = root.join("patient", JoinType.LEFT);
				Join<QueueTicket, Staff> staff = root.join("assignedStaff", JoinType.LEFT);
				predicate = cb.and(predicate, cb.or(
					cb.like(cb.lower(root.get("queueCode")), pattern),
					cb.like(cb.lower(patient.get("patientCode")), pattern),
					cb.like(cb.lower(patient.get("firstName")), pattern),
					cb.like(cb.lower(patient.get("lastName")), pattern),
					cb.like(cb.lower(staff.get("firstName")), pattern),
					cb.like(cb.lower(staff.get("lastName")), pattern)
				));
			}
			return predicate;
		};
	}

	private String mergeNotes(String existing, String addition) {
		String normalized = normalizeOptional(addition);
		if (normalized == null) {
			return existing;
		}
		if (existing == null || existing.isBlank()) {
			return normalized;
		}
		return existing + "\n" + normalized;
	}

	private String normalizeOptional(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
