package com.mediflow.clinic.patient.mapper;

import org.springframework.stereotype.Component;

import com.mediflow.clinic.patient.dto.PatientCreateRequest;
import com.mediflow.clinic.patient.dto.PatientResponse;
import com.mediflow.clinic.patient.dto.PatientUpdateRequest;
import com.mediflow.clinic.patient.entity.Patient;
import com.mediflow.clinic.user.entity.User;

@Component
public class PatientMapper {

	public Patient toEntity(PatientCreateRequest request, User user) {
		Patient patient = new Patient();
		apply(patient, request, user);
		return patient;
	}

	public void updateEntity(Patient patient, PatientUpdateRequest request, User user) {
		patient.setUser(user);
		patient.setFirstName(request.firstName().trim());
		patient.setLastName(request.lastName().trim());
		patient.setKhmerName(normalizeOptional(request.khmerName()));
		patient.setGender(request.gender());
		patient.setDateOfBirth(request.dateOfBirth());
		patient.setPhone(request.phone().trim());
		patient.setEmail(normalizeOptional(request.email()));
		patient.setAddress(request.address().trim());
		patient.setBloodType(normalizeOptional(request.bloodType()));
		patient.setAllergies(normalizeOptional(request.allergies()));
		patient.setEmergencyContactName(normalizeOptional(request.emergencyContactName()));
		patient.setEmergencyContactPhone(normalizeOptional(request.emergencyContactPhone()));
	}

	public PatientResponse toResponse(Patient patient) {
		return new PatientResponse(
			patient.getId(),
			patient.getPatientCode(),
			patient.getUser() == null ? null : patient.getUser().getId(),
			patient.getFirstName(),
			patient.getLastName(),
			patient.getFirstName() + " " + patient.getLastName(),
			patient.getKhmerName(),
			patient.getGender(),
			patient.getDateOfBirth(),
			patient.getPhone(),
			patient.getEmail(),
			patient.getAddress(),
			patient.getBloodType(),
			patient.getAllergies(),
			patient.getEmergencyContactName(),
			patient.getEmergencyContactPhone(),
			patient.getCreatedAt(),
			patient.getUpdatedAt()
		);
	}

	private void apply(Patient patient, PatientCreateRequest request, User user) {
		patient.setUser(user);
		patient.setFirstName(request.firstName().trim());
		patient.setLastName(request.lastName().trim());
		patient.setKhmerName(normalizeOptional(request.khmerName()));
		patient.setGender(request.gender());
		patient.setDateOfBirth(request.dateOfBirth());
		patient.setPhone(request.phone().trim());
		patient.setEmail(normalizeOptional(request.email()));
		patient.setAddress(request.address().trim());
		patient.setBloodType(normalizeOptional(request.bloodType()));
		patient.setAllergies(normalizeOptional(request.allergies()));
		patient.setEmergencyContactName(normalizeOptional(request.emergencyContactName()));
		patient.setEmergencyContactPhone(normalizeOptional(request.emergencyContactPhone()));
	}

	private String normalizeOptional(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
