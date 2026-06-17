package com.mediflow.clinic.appointment.service;

import java.time.Instant;
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

import com.mediflow.clinic.appointment.dto.AppointmentCancelRequest;
import com.mediflow.clinic.appointment.dto.AppointmentCreateRequest;
import com.mediflow.clinic.appointment.dto.AppointmentRescheduleRequest;
import com.mediflow.clinic.appointment.dto.AppointmentResponse;
import com.mediflow.clinic.appointment.dto.AppointmentStatusUpdateRequest;
import com.mediflow.clinic.appointment.dto.AppointmentUpdateRequest;
import com.mediflow.clinic.appointment.entity.Appointment;
import com.mediflow.clinic.appointment.entity.AppointmentStatus;
import com.mediflow.clinic.appointment.repository.AppointmentRepository;
import com.mediflow.clinic.audit.service.AuditService;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.patient.entity.Patient;
import com.mediflow.clinic.patient.repository.PatientRepository;
import com.mediflow.clinic.staff.entity.Staff;
import com.mediflow.clinic.staff.repository.StaffRepository;

@Service
public class AppointmentService {

	private final AppointmentRepository appointmentRepository;
	private final PatientRepository patientRepository;
	private final StaffRepository staffRepository;
	private final AuditService auditService;

	public AppointmentService(
		AppointmentRepository appointmentRepository,
		PatientRepository patientRepository,
		StaffRepository staffRepository,
		AuditService auditService
	) {
		this.appointmentRepository = appointmentRepository;
		this.patientRepository = patientRepository;
		this.staffRepository = staffRepository;
		this.auditService = auditService;
	}

	@Transactional
	public AppointmentResponse create(AppointmentCreateRequest request) {
		Appointment appointment = new Appointment();
		apply(appointment, request.patientId(), request.doctorId(), request.scheduledAt(), request.durationMinutes(), request.reason(), request.notes());
		Appointment saved = appointmentRepository.save(appointment);
		auditService.record("APPOINTMENTS", "CREATE", "Appointment", saved.getId().toString(), saved.getPatient().getPatientCode());
		return toResponse(saved);
	}

	@Transactional(readOnly = true)
	public Page<AppointmentResponse> findAll(
		String search,
		AppointmentStatus status,
		Instant from,
		Instant to,
		Pageable pageable
	) {
		return appointmentRepository.findAll(filters(search, status, from, to), pageable).map(this::toResponse);
	}

	@Transactional(readOnly = true)
	public AppointmentResponse findById(UUID id) {
		return toResponse(findAppointment(id));
	}

	@Transactional
	public AppointmentResponse update(UUID id, AppointmentUpdateRequest request) {
		Appointment appointment = findAppointment(id);
		apply(appointment, request.patientId(), request.doctorId(), request.scheduledAt(), request.durationMinutes(), request.reason(), request.notes());
		appointment.setStatus(request.status());
		Appointment saved = appointmentRepository.save(appointment);
		auditService.record("APPOINTMENTS", "UPDATE", "Appointment", saved.getId().toString(), saved.getStatus().name());
		return toResponse(saved);
	}

	@Transactional
	public AppointmentResponse reschedule(UUID id, AppointmentRescheduleRequest request) {
		Appointment appointment = findAppointment(id);
		ensureCanChange(appointment);
		appointment.setScheduledAt(request.scheduledAt());
		appointment.setDurationMinutes(request.durationMinutes() == null ? appointment.getDurationMinutes() : request.durationMinutes());
		appointment.setNotes(mergeNotes(appointment.getNotes(), request.notes()));
		appointment.setStatus(AppointmentStatus.SCHEDULED);
		Appointment saved = appointmentRepository.save(appointment);
		auditService.record("APPOINTMENTS", "RESCHEDULE", "Appointment", saved.getId().toString(), saved.getScheduledAt().toString());
		return toResponse(saved);
	}

	@Transactional
	public AppointmentResponse updateStatus(UUID id, AppointmentStatusUpdateRequest request) {
		Appointment appointment = findAppointment(id);
		appointment.setStatus(request.status());
		appointment.setNotes(mergeNotes(appointment.getNotes(), request.notes()));
		Appointment saved = appointmentRepository.save(appointment);
		auditService.record("APPOINTMENTS", "STATUS_CHANGE", "Appointment", saved.getId().toString(), saved.getStatus().name());
		return toResponse(saved);
	}

	@Transactional
	public AppointmentResponse cancel(UUID id, AppointmentCancelRequest request) {
		Appointment appointment = findAppointment(id);
		appointment.setStatus(AppointmentStatus.CANCELLED);
		appointment.setNotes(mergeNotes(appointment.getNotes(), request == null ? null : request.reason()));
		Appointment saved = appointmentRepository.save(appointment);
		auditService.record("APPOINTMENTS", "CANCEL", "Appointment", saved.getId().toString(), saved.getPatient().getPatientCode());
		return toResponse(saved);
	}

	private void apply(Appointment appointment, UUID patientId, UUID doctorId, Instant scheduledAt, Integer durationMinutes, String reason, String notes) {
		appointment.setPatient(findPatient(patientId));
		appointment.setDoctor(resolveStaff(doctorId));
		appointment.setScheduledAt(scheduledAt);
		appointment.setDurationMinutes(durationMinutes == null ? 30 : durationMinutes);
		appointment.setReason(normalizeOptional(reason));
		appointment.setNotes(normalizeOptional(notes));
	}

	private Appointment findAppointment(UUID id) {
		return appointmentRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Appointment was not found."));
	}

	private Patient findPatient(UUID id) {
		return patientRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Patient was not found."));
	}

	private Staff resolveStaff(UUID id) {
		if (id == null) {
			return null;
		}
		return staffRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Staff member was not found."));
	}

	private void ensureCanChange(Appointment appointment) {
		if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.COMPLETED) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Completed or cancelled appointments cannot be rescheduled.");
		}
	}

	private AppointmentResponse toResponse(Appointment appointment) {
		Patient patient = appointment.getPatient();
		Staff doctor = appointment.getDoctor();
		return new AppointmentResponse(
			appointment.getId(),
			patient.getId(),
			patient.getPatientCode(),
			patient.getFirstName() + " " + patient.getLastName(),
			doctor == null ? null : doctor.getId(),
			doctor == null ? null : doctor.getFirstName() + " " + doctor.getLastName(),
			appointment.getScheduledAt(),
			appointment.getDurationMinutes(),
			appointment.getStatus(),
			appointment.getReason(),
			appointment.getNotes(),
			appointment.getCreatedAt(),
			appointment.getUpdatedAt()
		);
	}

	private Specification<Appointment> filters(String search, AppointmentStatus status, Instant from, Instant to) {
		return (root, query, cb) -> {
			if (query != null) {
				query.distinct(true);
			}
			var predicate = cb.conjunction();
			if (status != null) {
				predicate = cb.and(predicate, cb.equal(root.get("status"), status));
			}
			if (from != null) {
				predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("scheduledAt"), from));
			}
			if (to != null) {
				predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("scheduledAt"), to));
			}
			if (search != null && !search.isBlank()) {
				String pattern = "%" + search.toLowerCase(Locale.ROOT).trim() + "%";
				Join<Appointment, Patient> patient = root.join("patient", JoinType.LEFT);
				Join<Appointment, Staff> doctor = root.join("doctor", JoinType.LEFT);
				predicate = cb.and(predicate, cb.or(
					cb.like(cb.lower(patient.get("patientCode")), pattern),
					cb.like(cb.lower(patient.get("firstName")), pattern),
					cb.like(cb.lower(patient.get("lastName")), pattern),
					cb.like(cb.lower(doctor.get("firstName")), pattern),
					cb.like(cb.lower(doctor.get("lastName")), pattern),
					cb.like(cb.lower(root.get("reason")), pattern)
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
