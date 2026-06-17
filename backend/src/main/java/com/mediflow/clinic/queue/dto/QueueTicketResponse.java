package com.mediflow.clinic.queue.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.mediflow.clinic.queue.entity.QueueStatus;

public record QueueTicketResponse(
	UUID id,
	LocalDate queueDate,
	Integer queueNumber,
	String queueCode,
	UUID patientId,
	String patientCode,
	String patientName,
	UUID appointmentId,
	UUID assignedStaffId,
	String assignedStaffName,
	QueueStatus status,
	Integer priority,
	String notes,
	Instant checkedInAt,
	Instant calledAt,
	Instant completedAt,
	Instant createdAt,
	Instant updatedAt
) {
}
