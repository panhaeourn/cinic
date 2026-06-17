package com.mediflow.clinic.queue.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

import com.mediflow.clinic.queue.entity.QueueStatus;

public record QueueStatusUpdateRequest(
	@NotNull QueueStatus status,
	UUID assignedStaffId,
	String notes
) {
}
