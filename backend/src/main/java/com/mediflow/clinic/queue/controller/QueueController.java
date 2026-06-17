package com.mediflow.clinic.queue.controller;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.queue.dto.QueueCheckInRequest;
import com.mediflow.clinic.queue.dto.QueueStatusUpdateRequest;
import com.mediflow.clinic.queue.dto.QueueTicketResponse;
import com.mediflow.clinic.queue.entity.QueueStatus;
import com.mediflow.clinic.queue.service.QueueService;

@RestController
@RequestMapping("/api/queue")
public class QueueController {

	private final QueueService queueService;

	public QueueController(QueueService queueService) {
		this.queueService = queueService;
	}

	@PostMapping("/check-in")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('QUEUE_MANAGE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public QueueTicketResponse checkIn(@Valid @RequestBody QueueCheckInRequest request) {
		return queueService.checkIn(request);
	}

	@GetMapping
	@PreAuthorize("hasAuthority('QUEUE_VIEW') and hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST_CASHIER', 'NURSE')")
	public Page<QueueTicketResponse> findAll(
		@RequestParam(required = false) String search,
		@RequestParam(required = false) QueueStatus status,
		@RequestParam(required = false) LocalDate date,
		@PageableDefault(size = 40, sort = "checkedInAt") Pageable pageable
	) {
		return queueService.findAll(search, status, date, pageable);
	}

	@PostMapping("/{id}/status")
	@PreAuthorize("hasAuthority('QUEUE_MANAGE') and hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST_CASHIER', 'NURSE')")
	public QueueTicketResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody QueueStatusUpdateRequest request) {
		return queueService.updateStatus(id, request);
	}
}
