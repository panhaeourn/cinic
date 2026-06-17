package com.mediflow.clinic.billing.controller;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.billing.dto.ServicePriceRequest;
import com.mediflow.clinic.billing.dto.ServicePriceResponse;
import com.mediflow.clinic.billing.service.ServicePriceService;

@RestController
@RequestMapping("/api/billing-services")
public class ServicePriceController {

	private final ServicePriceService servicePriceService;

	public ServicePriceController(ServicePriceService servicePriceService) {
		this.servicePriceService = servicePriceService;
	}

	@GetMapping
	@PreAuthorize("hasAuthority('INVOICE_VIEW') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public Page<ServicePriceResponse> findAll(
		@RequestParam(required = false) String search,
		@RequestParam(required = false) Boolean active,
		@PageableDefault(size = 40, sort = "name") Pageable pageable
	) {
		return servicePriceService.findAll(search, active, pageable);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('INVOICE_CREATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public ServicePriceResponse create(@Valid @RequestBody ServicePriceRequest request) {
		return servicePriceService.create(request);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasAuthority('INVOICE_CREATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public ServicePriceResponse update(@PathVariable UUID id, @Valid @RequestBody ServicePriceRequest request) {
		return servicePriceService.update(id, request);
	}

	@PatchMapping("/{id}/active")
	@PreAuthorize("hasAuthority('INVOICE_CREATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public ServicePriceResponse setActive(@PathVariable UUID id, @RequestParam boolean active) {
		return servicePriceService.setActive(id, active);
	}
}
