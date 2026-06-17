package com.mediflow.clinic.audit.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
	UUID id,
	String actorEmail,
	String actorName,
	String module,
	String action,
	String entityType,
	String entityId,
	String details,
	Instant createdAt
) {
}
