package com.mediflow.clinic.patient.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.common.code.CodeGeneratorService;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.common.response.CursorPageResponse;
import com.mediflow.clinic.patient.dto.PatientCreateRequest;
import com.mediflow.clinic.patient.dto.PatientResponse;
import com.mediflow.clinic.patient.dto.PatientListItemResponse;
import com.mediflow.clinic.patient.dto.PatientUpdateRequest;
import com.mediflow.clinic.patient.entity.Patient;
import com.mediflow.clinic.patient.entity.Gender;
import com.mediflow.clinic.patient.mapper.PatientMapper;
import com.mediflow.clinic.patient.repository.PatientRepository;
import com.mediflow.clinic.user.entity.User;
import com.mediflow.clinic.user.repository.UserRepository;

@Service
public class PatientService {

	private final PatientRepository patientRepository;
	private final UserRepository userRepository;
	private final PatientMapper patientMapper;
	private final CodeGeneratorService codeGeneratorService;

	public PatientService(
		PatientRepository patientRepository,
		UserRepository userRepository,
		PatientMapper patientMapper,
		CodeGeneratorService codeGeneratorService
	) {
		this.patientRepository = patientRepository;
		this.userRepository = userRepository;
		this.patientMapper = patientMapper;
		this.codeGeneratorService = codeGeneratorService;
	}

	@Transactional
	public PatientResponse create(PatientCreateRequest request) {
		User user = resolveUser(request.userId());
		Patient patient = patientMapper.toEntity(request, user);
		patient.setPatientCode(codeGeneratorService.nextPatientCode());
		return patientMapper.toResponse(patientRepository.save(patient));
	}

	@Transactional(readOnly = true)
	public Page<PatientResponse> findAll(String search, Pageable pageable) {
		String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
		if (normalizedSearch == null) {
			return patientRepository.findAll(pageable).map(patientMapper::toResponse);
		}
		return patientRepository.findAll(searchSpec(normalizedSearch), pageable).map(patientMapper::toResponse);
	}

	@Transactional(readOnly = true)
	public CursorPageResponse<PatientListItemResponse> findCursor(String search, String cursor, int requestedSize) {
		int size = Math.max(1, Math.min(requestedSize, 100));
		PatientCursor decodedCursor = decodeCursor(cursor);
		String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
		List<PatientRepository.PatientListProjection> rows = patientRepository.findCursor(
			normalizedSearch,
			decodedCursor == null ? null : decodedCursor.createdAt(),
			decodedCursor == null ? null : decodedCursor.id(),
			size + 1
		);
		boolean hasMore = rows.size() > size;
		List<PatientRepository.PatientListProjection> pageRows = hasMore ? rows.subList(0, size) : rows;
		List<PatientListItemResponse> items = pageRows.stream().map(this::toListItem).toList();
		String nextCursor = hasMore && !pageRows.isEmpty() ? encodeCursor(pageRows.get(pageRows.size() - 1)) : null;
		return new CursorPageResponse<>(items, nextCursor, hasMore);
	}

	@Transactional(readOnly = true)
	public PatientResponse findById(UUID id) {
		return patientMapper.toResponse(findPatient(id));
	}

	@Transactional
	public PatientResponse update(UUID id, PatientUpdateRequest request) {
		Patient patient = findPatient(id);
		User user = resolveUser(request.userId());
		patientMapper.updateEntity(patient, request, user);
		return patientMapper.toResponse(patientRepository.save(patient));
	}

	private Patient findPatient(UUID id) {
		return patientRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Patient was not found."));
	}

	private User resolveUser(UUID userId) {
		if (userId == null) {
			return null;
		}
		return userRepository.findById(userId)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Linked user was not found."));
	}

	private Specification<Patient> searchSpec(String search) {
		return (root, query, criteriaBuilder) -> {
			String pattern = "%" + search.toLowerCase() + "%";
			return criteriaBuilder.or(
				criteriaBuilder.like(criteriaBuilder.lower(root.get("patientCode")), pattern),
				criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), pattern),
				criteriaBuilder.like(criteriaBuilder.lower(root.get("lastName")), pattern),
				criteriaBuilder.like(criteriaBuilder.lower(root.get("khmerName")), pattern),
				criteriaBuilder.like(criteriaBuilder.lower(root.get("phone")), pattern),
				criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern)
			);
		};
	}

	private PatientListItemResponse toListItem(PatientRepository.PatientListProjection row) {
		return new PatientListItemResponse(
			row.getId(),
			row.getPatientCode(),
			row.getFullName(),
			row.getKhmerName(),
			Gender.valueOf(row.getGender()),
			row.getDateOfBirth(),
			row.getPhone(),
			row.getEmail(),
			row.getBloodType(),
			row.getCreatedAt()
		);
	}

	private String encodeCursor(PatientRepository.PatientListProjection row) {
		String value = row.getCreatedAt() + "|" + row.getId();
		return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
	}

	private PatientCursor decodeCursor(String cursor) {
		if (cursor == null || cursor.isBlank()) {
			return null;
		}
		try {
			String decoded = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
			int separator = decoded.lastIndexOf('|');
			if (separator <= 0 || separator == decoded.length() - 1) {
				throw new IllegalArgumentException("Missing cursor separator");
			}
			return new PatientCursor(
				Instant.parse(decoded.substring(0, separator)),
				UUID.fromString(decoded.substring(separator + 1))
			);
		} catch (IllegalArgumentException exception) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Patient cursor is invalid.");
		}
	}

	private record PatientCursor(Instant createdAt, UUID id) {
	}
}
