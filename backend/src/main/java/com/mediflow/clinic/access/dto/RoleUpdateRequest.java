package com.mediflow.clinic.access.dto;

import java.util.Set;

import jakarta.validation.constraints.NotNull;

public record RoleUpdateRequest(@NotNull Set<String> roles) {
}
