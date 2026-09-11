package com.mediflow.clinic.patient.repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mediflow.clinic.patient.entity.Patient;

public interface PatientRepository extends JpaRepository<Patient, UUID>, JpaSpecificationExecutor<Patient> {

	boolean existsByPhone(String phone);

	@Query(value = """
		select
			p.id as id,
			p.patient_code as patientCode,
			p.first_name || ' ' || p.last_name as fullName,
			p.gender as gender,
			p.date_of_birth as dateOfBirth,
			p.phone as phone,
			p.email as email,
			p.blood_type as bloodType,
			p.created_at as createdAt
		from patients p
		where (
			cast(:search as text) is null
			or lower(
				p.patient_code || ' ' || p.first_name || ' ' || p.last_name || ' ' || p.phone || ' ' || coalesce(p.email, '')
			) like '%' || lower(cast(:search as text)) || '%'
		)
		and (p.created_at, p.id) < (
			coalesce(cast(:cursorCreatedAt as timestamptz), 'infinity'::timestamptz),
			coalesce(cast(:cursorId as uuid), 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
		)
		order by p.created_at desc, p.id desc
		limit :limit
		""", nativeQuery = true)
	List<PatientListProjection> findCursor(
		@Param("search") String search,
		@Param("cursorCreatedAt") Instant cursorCreatedAt,
		@Param("cursorId") UUID cursorId,
		@Param("limit") int limit
	);

	interface PatientListProjection {
		UUID getId();
		String getPatientCode();
		String getFullName();
		String getGender();
		LocalDate getDateOfBirth();
		String getPhone();
		String getEmail();
		String getBloodType();
		Instant getCreatedAt();
	}
}
