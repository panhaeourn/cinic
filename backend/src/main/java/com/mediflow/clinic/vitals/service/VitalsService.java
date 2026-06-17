package com.mediflow.clinic.vitals.service;

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
import com.mediflow.clinic.encounter.entity.Encounter;
import com.mediflow.clinic.encounter.repository.EncounterRepository;
import com.mediflow.clinic.patient.entity.Patient;
import com.mediflow.clinic.patient.repository.PatientRepository;
import com.mediflow.clinic.queue.entity.QueueTicket;
import com.mediflow.clinic.queue.repository.QueueTicketRepository;
import com.mediflow.clinic.staff.entity.Staff;
import com.mediflow.clinic.staff.repository.StaffRepository;
import com.mediflow.clinic.vitals.dto.VitalsRequest;
import com.mediflow.clinic.vitals.dto.VitalsResponse;
import com.mediflow.clinic.vitals.entity.Vitals;
import com.mediflow.clinic.vitals.repository.VitalsRepository;

@Service
public class VitalsService {

	private final VitalsRepository vitalsRepository;
	private final PatientRepository patientRepository;
	private final QueueTicketRepository queueTicketRepository;
	private final EncounterRepository encounterRepository;
	private final StaffRepository staffRepository;
	private final AuditService auditService;

	public VitalsService(
		VitalsRepository vitalsRepository,
		PatientRepository patientRepository,
		QueueTicketRepository queueTicketRepository,
		EncounterRepository encounterRepository,
		StaffRepository staffRepository,
		AuditService auditService
	) {
		this.vitalsRepository = vitalsRepository;
		this.patientRepository = patientRepository;
		this.queueTicketRepository = queueTicketRepository;
		this.encounterRepository = encounterRepository;
		this.staffRepository = staffRepository;
		this.auditService = auditService;
	}

	@Transactional
	public VitalsResponse create(VitalsRequest request) {
		Vitals vitals = new Vitals();
		apply(vitals, request);
		Vitals saved = vitalsRepository.save(vitals);
		auditService.record("VITALS", "CREATE", "Vitals", saved.getId().toString(), saved.getPatient().getPatientCode());
		return toResponse(saved);
	}

	@Transactional(readOnly = true)
	public Page<VitalsResponse> findAll(String search, UUID patientId, UUID queueTicketId, UUID encounterId, Pageable pageable) {
		return vitalsRepository.findAll(filters(search, patientId, queueTicketId, encounterId), pageable).map(this::toResponse);
	}

	@Transactional(readOnly = true)
	public VitalsResponse findById(UUID id) {
		return toResponse(findVitals(id));
	}

	@Transactional
	public VitalsResponse update(UUID id, VitalsRequest request) {
		Vitals vitals = findVitals(id);
		apply(vitals, request);
		Vitals saved = vitalsRepository.save(vitals);
		auditService.record("VITALS", "UPDATE", "Vitals", saved.getId().toString(), saved.getPatient().getPatientCode());
		return toResponse(saved);
	}

	private void apply(Vitals vitals, VitalsRequest request) {
		Patient patient = findPatient(request.patientId());
		QueueTicket queueTicket = resolveQueueTicket(request.queueTicketId());
		Encounter encounter = resolveEncounter(request.encounterId());
		if (queueTicket != null && !queueTicket.getPatient().getId().equals(patient.getId())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Queue ticket belongs to another patient.");
		}
		if (encounter != null && !encounter.getPatient().getId().equals(patient.getId())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Encounter belongs to another patient.");
		}
		vitals.setPatient(patient);
		vitals.setQueueTicket(queueTicket);
		vitals.setEncounter(encounter);
		vitals.setNurse(resolveStaff(request.nurseId()));
		vitals.setSystolicBp(request.systolicBp());
		vitals.setDiastolicBp(request.diastolicBp());
		vitals.setTemperatureC(request.temperatureC());
		vitals.setOxygenSaturation(request.oxygenSaturation());
		vitals.setHeartRate(request.heartRate());
		vitals.setWeightKg(request.weightKg());
		vitals.setHeightCm(request.heightCm());
		vitals.setNotes(normalizeOptional(request.notes()));
		vitals.setRecordedAt(request.recordedAt() == null ? Instant.now() : request.recordedAt());
	}

	private Vitals findVitals(UUID id) {
		return vitalsRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vitals record was not found."));
	}

	private Patient findPatient(UUID id) {
		return patientRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Patient was not found."));
	}

	private QueueTicket resolveQueueTicket(UUID id) {
		if (id == null) {
			return null;
		}
		return queueTicketRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Queue ticket was not found."));
	}

	private Encounter resolveEncounter(UUID id) {
		if (id == null) {
			return null;
		}
		return encounterRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Encounter was not found."));
	}

	private Staff resolveStaff(UUID id) {
		if (id == null) {
			return null;
		}
		return staffRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Staff member was not found."));
	}

	private VitalsResponse toResponse(Vitals vitals) {
		Patient patient = vitals.getPatient();
		QueueTicket queueTicket = vitals.getQueueTicket();
		Staff nurse = vitals.getNurse();
		return new VitalsResponse(
			vitals.getId(),
			patient.getId(),
			patient.getPatientCode(),
			patient.getFirstName() + " " + patient.getLastName(),
			queueTicket == null ? null : queueTicket.getId(),
			queueTicket == null ? null : queueTicket.getQueueCode(),
			vitals.getEncounter() == null ? null : vitals.getEncounter().getId(),
			nurse == null ? null : nurse.getId(),
			nurse == null ? null : nurse.getFirstName() + " " + nurse.getLastName(),
			vitals.getSystolicBp(),
			vitals.getDiastolicBp(),
			vitals.getTemperatureC(),
			vitals.getOxygenSaturation(),
			vitals.getHeartRate(),
			vitals.getWeightKg(),
			vitals.getHeightCm(),
			vitals.getNotes(),
			vitals.getRecordedAt(),
			vitals.getCreatedAt(),
			vitals.getUpdatedAt()
		);
	}

	private Specification<Vitals> filters(String search, UUID patientId, UUID queueTicketId, UUID encounterId) {
		return (root, query, cb) -> {
			if (query != null) {
				query.distinct(true);
			}
			var predicate = cb.conjunction();
			if (patientId != null) {
				predicate = cb.and(predicate, cb.equal(root.join("patient", JoinType.LEFT).get("id"), patientId));
			}
			if (queueTicketId != null) {
				predicate = cb.and(predicate, cb.equal(root.join("queueTicket", JoinType.LEFT).get("id"), queueTicketId));
			}
			if (encounterId != null) {
				predicate = cb.and(predicate, cb.equal(root.join("encounter", JoinType.LEFT).get("id"), encounterId));
			}
			if (search != null && !search.isBlank()) {
				String pattern = "%" + search.toLowerCase(Locale.ROOT).trim() + "%";
				Join<Vitals, Patient> patient = root.join("patient", JoinType.LEFT);
				Join<Vitals, Staff> nurse = root.join("nurse", JoinType.LEFT);
				predicate = cb.and(predicate, cb.or(
					cb.like(cb.lower(patient.get("patientCode")), pattern),
					cb.like(cb.lower(patient.get("firstName")), pattern),
					cb.like(cb.lower(patient.get("lastName")), pattern),
					cb.like(cb.lower(nurse.get("firstName")), pattern),
					cb.like(cb.lower(nurse.get("lastName")), pattern)
				));
			}
			return predicate;
		};
	}

	private String normalizeOptional(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
