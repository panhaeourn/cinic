package com.mediflow.clinic.appointment.controller;

import java.time.Instant;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.appointment.dto.AppointmentCancelRequest;
import com.mediflow.clinic.appointment.dto.AppointmentCreateRequest;
import com.mediflow.clinic.appointment.dto.AppointmentRescheduleRequest;
import com.mediflow.clinic.appointment.dto.AppointmentResponse;
import com.mediflow.clinic.appointment.dto.AppointmentStatusUpdateRequest;
import com.mediflow.clinic.appointment.dto.AppointmentUpdateRequest;
import com.mediflow.clinic.appointment.entity.AppointmentStatus;
import com.mediflow.clinic.appointment.service.AppointmentService;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

	private final AppointmentService appointmentService;

	public AppointmentController(AppointmentService appointmentService) {
		this.appointmentService = appointmentService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('APPOINTMENT_CREATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public AppointmentResponse create(@Valid @RequestBody AppointmentCreateRequest request) {
		return appointmentService.create(request);
	}

	@GetMapping
	@PreAuthorize("hasAuthority('APPOINTMENT_VIEW') and hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST_CASHIER', 'NURSE')")
	public Page<AppointmentResponse> findAll(
		@RequestParam(required = false) String search,
		@RequestParam(required = false) AppointmentStatus status,
		@RequestParam(required = false) Instant from,
		@RequestParam(required = false) Instant to,
		@PageableDefault(size = 20, sort = "scheduledAt") Pageable pageable
	) {
		return appointmentService.findAll(search, status, from, to, pageable);
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAuthority('APPOINTMENT_VIEW') and hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST_CASHIER', 'NURSE')")
	public AppointmentResponse findById(@PathVariable UUID id) {
		return appointmentService.findById(id);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasAuthority('APPOINTMENT_UPDATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public AppointmentResponse update(@PathVariable UUID id, @Valid @RequestBody AppointmentUpdateRequest request) {
		return appointmentService.update(id, request);
	}

	@PostMapping("/{id}/reschedule")
	@PreAuthorize("hasAuthority('APPOINTMENT_UPDATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public AppointmentResponse reschedule(@PathVariable UUID id, @Valid @RequestBody AppointmentRescheduleRequest request) {
		return appointmentService.reschedule(id, request);
	}

	@PostMapping("/{id}/status")
	@PreAuthorize("hasAuthority('APPOINTMENT_UPDATE') and hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST_CASHIER', 'NURSE')")
	public AppointmentResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody AppointmentStatusUpdateRequest request) {
		return appointmentService.updateStatus(id, request);
	}

	@PostMapping("/{id}/cancel")
	@PreAuthorize("hasAuthority('APPOINTMENT_CANCEL') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public AppointmentResponse cancel(@PathVariable UUID id, @RequestBody(required = false) AppointmentCancelRequest request) {
		return appointmentService.cancel(id, request);
	}
}
