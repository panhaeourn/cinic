package com.mediflow.clinic.encounter.service;

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

import com.mediflow.clinic.audit.service.AuditService;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.encounter.dto.EncounterCompleteRequest;
import com.mediflow.clinic.encounter.dto.EncounterCreateRequest;
import com.mediflow.clinic.encounter.dto.EncounterResponse;
import com.mediflow.clinic.encounter.dto.EncounterUpdateRequest;
import com.mediflow.clinic.encounter.entity.Encounter;
import com.mediflow.clinic.encounter.entity.EncounterStatus;
import com.mediflow.clinic.encounter.repository.EncounterRepository;
import com.mediflow.clinic.patient.entity.Patient;
import com.mediflow.clinic.patient.repository.PatientRepository;
import com.mediflow.clinic.queue.entity.QueueStatus;
import com.mediflow.clinic.queue.entity.QueueTicket;
import com.mediflow.clinic.queue.repository.QueueTicketRepository;
import com.mediflow.clinic.staff.entity.Staff;
import com.mediflow.clinic.staff.repository.StaffRepository;

@Service
public class EncounterService {

	private final EncounterRepository encounterRepository;
	private final PatientRepository patientRepository;
	private final StaffRepository staffRepository;
	private final QueueTicketRepository queueTicketRepository;
	private final AuditService auditService;

	public EncounterService(
		EncounterRepository encounterRepository,
		PatientRepository patientRepository,
		StaffRepository staffRepository,
		QueueTicketRepository queueTicketRepository,
		AuditService auditService
	) {
		this.encounterRepository = encounterRepository;
		this.patientRepository = patientRepository;
		this.staffRepository = staffRepository;
		this.queueTicketRepository = queueTicketRepository;
		this.auditService = auditService;
	}

	@Transactional
	public EncounterResponse create(EncounterCreateRequest request) {
		Encounter encounter = new Encounter();
		apply(encounter, request.patientId(), request.doctorId(), request.queueTicketId(), request.chiefComplaint(), request.symptoms(), request.diagnosis(), request.notes());
		Encounter saved = encounterRepository.save(encounter);
		auditService.record("ENCOUNTERS", "CREATE", "Encounter", saved.getId().toString(), saved.getPatient().getPatientCode());
		return toResponse(saved);
	}

	@Transactional(readOnly = true)
	public Page<EncounterResponse> findAll(String search, EncounterStatus status, UUID patientId, Pageable pageable) {
		return encounterRepository.findAll(filters(search, status, patientId), pageable).map(this::toResponse);
	}

	@Transactional(readOnly = true)
	public EncounterResponse findById(UUID id) {
		return toResponse(findEncounter(id));
	}

	@Transactional
	public EncounterResponse update(UUID id, EncounterUpdateRequest request) {
		Encounter encounter = findEncounter(id);
		apply(encounter, request.patientId(), request.doctorId(), request.queueTicketId(), request.chiefComplaint(), request.symptoms(), request.diagnosis(), request.notes());
		encounter.setStatus(request.status());
		if (request.status() == EncounterStatus.COMPLETED && encounter.getCompletedAt() == null) {
			encounter.setCompletedAt(Instant.now());
		}
		Encounter saved = encounterRepository.save(encounter);
		auditService.record("ENCOUNTERS", "UPDATE", "Encounter", saved.getId().toString(), saved.getStatus().name());
		return toResponse(saved);
	}

	@Transactional
	public EncounterResponse complete(UUID id, EncounterCompleteRequest request) {
		Encounter encounter = findEncounter(id);
		if (request != null) {
			encounter.setDiagnosis(normalizeOptional(request.diagnosis()) == null ? encounter.getDiagnosis() : normalizeOptional(request.diagnosis()));
			encounter.setNotes(mergeNotes(encounter.getNotes(), request.notes()));
		}
		encounter.setStatus(EncounterStatus.COMPLETED);
		encounter.setCompletedAt(Instant.now());
		if (encounter.getQueueTicket() != null) {
			encounter.getQueueTicket().setStatus(QueueStatus.COMPLETED);
			encounter.getQueueTicket().setCompletedAt(Instant.now());
		}
		Encounter saved = encounterRepository.save(encounter);
		auditService.record("ENCOUNTERS", "COMPLETE", "Encounter", saved.getId().toString(), saved.getPatient().getPatientCode());
		return toResponse(saved);
	}

	private void apply(
		Encounter encounter,
		UUID patientId,
		UUID doctorId,
		UUID queueTicketId,
		String chiefComplaint,
		String symptoms,
		String diagnosis,
		String notes
	) {
		Patient patient = findPatient(patientId);
		QueueTicket queueTicket = resolveQueueTicket(queueTicketId);
		if (queueTicket != null && !queueTicket.getPatient().getId().equals(patient.getId())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Queue ticket belongs to another patient.");
		}
		encounter.setPatient(patient);
		encounter.setDoctor(resolveStaff(doctorId));
		encounter.setQueueTicket(queueTicket);
		encounter.setChiefComplaint(normalizeOptional(chiefComplaint));
		encounter.setSymptoms(normalizeOptional(symptoms));
		encounter.setDiagnosis(normalizeOptional(diagnosis));
		encounter.setNotes(normalizeOptional(notes));
	}

	private Encounter findEncounter(UUID id) {
		return encounterRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Encounter was not found."));
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

	private QueueTicket resolveQueueTicket(UUID id) {
		if (id == null) {
			return null;
		}
		return queueTicketRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Queue ticket was not found."));
	}

	private EncounterResponse toResponse(Encounter encounter) {
		Patient patient = encounter.getPatient();
		Staff doctor = encounter.getDoctor();
		QueueTicket queueTicket = encounter.getQueueTicket();
		return new EncounterResponse(
			encounter.getId(),
			patient.getId(),
			patient.getPatientCode(),
			patient.getFirstName() + " " + patient.getLastName(),
			doctor == null ? null : doctor.getId(),
			doctor == null ? null : doctor.getFirstName() + " " + doctor.getLastName(),
			queueTicket == null ? null : queueTicket.getId(),
			queueTicket == null ? null : queueTicket.getQueueCode(),
			encounter.getStatus(),
			encounter.getChiefComplaint(),
			encounter.getSymptoms(),
			encounter.getDiagnosis(),
			encounter.getNotes(),
			encounter.getStartedAt(),
			encounter.getCompletedAt(),
			encounter.getCreatedAt(),
			encounter.getUpdatedAt()
		);
	}

	private Specification<Encounter> filters(String search, EncounterStatus status, UUID patientId) {
		return (root, query, cb) -> {
			if (query != null) {
				query.distinct(true);
			}
			var predicate = cb.conjunction();
			if (status != null) {
				predicate = cb.and(predicate, cb.equal(root.get("status"), status));
			}
			if (patientId != null) {
				Join<Encounter, Patient> patient = root.join("patient", JoinType.LEFT);
				predicate = cb.and(predicate, cb.equal(patient.get("id"), patientId));
			}
			if (search != null && !search.isBlank()) {
				String pattern = "%" + search.toLowerCase(Locale.ROOT).trim() + "%";
				Join<Encounter, Patient> patient = root.join("patient", JoinType.LEFT);
				Join<Encounter, Staff> doctor = root.join("doctor", JoinType.LEFT);
				predicate = cb.and(predicate, cb.or(
					cb.like(cb.lower(patient.get("patientCode")), pattern),
					cb.like(cb.lower(patient.get("firstName")), pattern),
					cb.like(cb.lower(patient.get("lastName")), pattern),
					cb.like(cb.lower(doctor.get("firstName")), pattern),
					cb.like(cb.lower(doctor.get("lastName")), pattern),
					cb.like(cb.lower(root.get("chiefComplaint")), pattern),
					cb.like(cb.lower(root.get("diagnosis")), pattern)
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
