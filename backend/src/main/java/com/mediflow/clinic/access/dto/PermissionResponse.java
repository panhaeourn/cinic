package com.mediflow.clinic.access.dto;

import java.util.UUID;

public record PermissionResponse(UUID id, String code, String description) {
}
