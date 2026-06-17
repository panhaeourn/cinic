package com.mediflow.clinic.common.code;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
	name = "code_sequences",
	uniqueConstraints = @UniqueConstraint(name = "uk_code_sequences_type_year", columnNames = {"code_type", "sequence_year"})
)
public class CodeSequence {

	@Id
	@GeneratedValue
	private UUID id;

	@Column(name = "code_type", nullable = false, length = 60)
	private String codeType;

	@Column(name = "sequence_year", nullable = false)
	private int sequenceYear;

	@Column(nullable = false)
	private int lastNumber;

	@Column(nullable = false)
	private Instant updatedAt = Instant.now();

	protected CodeSequence() {
	}

	public CodeSequence(String codeType, int sequenceYear) {
		this.codeType = codeType;
		this.sequenceYear = sequenceYear;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public int nextNumber() {
		lastNumber += 1;
		return lastNumber;
	}

	public String getCodeType() {
		return codeType;
	}

	public int getSequenceYear() {
		return sequenceYear;
	}

	public int getLastNumber() {
		return lastNumber;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
