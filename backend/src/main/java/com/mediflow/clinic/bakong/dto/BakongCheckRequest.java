package com.mediflow.clinic.bakong.dto;

import jakarta.validation.constraints.NotBlank;

public record BakongCheckRequest(@NotBlank String md5) {
}
