package com.mediflow.clinic.audit.controller;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.audit.dto.AuditLogResponse;
import com.mediflow.clinic.audit.service.AuditService;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

	private final AuditService auditService;

	public AuditLogController(AuditService auditService) {
		this.auditService = auditService;
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public Page<AuditLogResponse> findAll(
		@RequestParam(required = false) String user,
		@RequestParam(required = false) String module,
		@RequestParam(required = false) String action,
		@RequestParam(required = false) Instant from,
		@RequestParam(required = false) Instant to,
		@PageableDefault(size = 30, sort = "createdAt") Pageable pageable
	) {
		return auditService.findAll(user, module, action, from, to, pageable);
	}
}
