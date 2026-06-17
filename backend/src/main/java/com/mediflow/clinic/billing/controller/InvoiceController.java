package com.mediflow.clinic.billing.controller;

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

import com.mediflow.clinic.billing.dto.InvoiceCreateRequest;
import com.mediflow.clinic.billing.dto.InvoiceItemRequest;
import com.mediflow.clinic.billing.dto.InvoiceResponse;
import com.mediflow.clinic.billing.dto.PaymentCreateRequest;
import com.mediflow.clinic.billing.dto.PaymentResponse;
import com.mediflow.clinic.billing.dto.ReceiptResponse;
import com.mediflow.clinic.billing.entity.InvoiceStatus;
import com.mediflow.clinic.billing.service.BillingService;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

	private final BillingService billingService;

	public InvoiceController(BillingService billingService) {
		this.billingService = billingService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('INVOICE_CREATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public InvoiceResponse create(@Valid @RequestBody InvoiceCreateRequest request) {
		return billingService.create(request);
	}

	@GetMapping
	@PreAuthorize("hasAuthority('INVOICE_VIEW') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public Page<InvoiceResponse> findAll(
		@RequestParam(required = false) String search,
		@RequestParam(required = false) InvoiceStatus status,
		@RequestParam(required = false) UUID patientId,
		@PageableDefault(size = 20, sort = "createdAt") Pageable pageable
	) {
		return billingService.findAll(search, status, patientId, pageable);
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAuthority('INVOICE_VIEW') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public InvoiceResponse findById(@PathVariable UUID id) {
		return billingService.findById(id);
	}

	@PostMapping("/{id}/items")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('INVOICE_CREATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public InvoiceResponse addItem(@PathVariable UUID id, @Valid @RequestBody InvoiceItemRequest request) {
		return billingService.addItem(id, request);
	}

	@PostMapping("/{id}/payments")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('PAYMENT_CREATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public PaymentResponse recordPayment(@PathVariable UUID id, @Valid @RequestBody PaymentCreateRequest request) {
		return billingService.recordPayment(id, request);
	}

	@GetMapping("/{id}/receipt")
	@PreAuthorize("hasAuthority('RECEIPT_PRINT') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public ReceiptResponse receipt(@PathVariable UUID id) {
		return billingService.receipt(id);
	}
}
