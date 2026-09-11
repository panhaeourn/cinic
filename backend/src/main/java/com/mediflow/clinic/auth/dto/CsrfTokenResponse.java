package com.mediflow.clinic.auth.dto;

public record CsrfTokenResponse(String headerName, String token) {
}
