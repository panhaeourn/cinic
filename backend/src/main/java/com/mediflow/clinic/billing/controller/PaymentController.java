package com.mediflow.clinic.billing.controller;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.billing.dto.PaymentRefundRequest;
import com.mediflow.clinic.billing.dto.PaymentResponse;
import com.mediflow.clinic.billing.dto.PaymentSummaryResponse;
import com.mediflow.clinic.billing.entity.PaymentMethod;
import com.mediflow.clinic.billing.service.BillingService;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

	private final BillingService billingService;

	public PaymentController(BillingService billingService) {
		this.billingService = billingService;
	}

	@GetMapping
	@PreAuthorize("hasAuthority('PAYMENT_VIEW') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public Page<PaymentResponse> findAll(
		@RequestParam(required = false) String search,
		@RequestParam(required = false) PaymentMethod method,
		@RequestParam(required = false) Instant from,
		@RequestParam(required = false) Instant to,
		@PageableDefault(size = 20, sort = "paidAt") Pageable pageable
	) {
		return billingService.findPayments(search, method, from, to, pageable);
	}

	@GetMapping("/summary")
	@PreAuthorize("hasAuthority('PAYMENT_VIEW') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public PaymentSummaryResponse summary(
		@RequestParam(required = false) String search,
		@RequestParam(required = false) PaymentMethod method,
		@RequestParam(required = false) Instant from,
		@RequestParam(required = false) Instant to
	) {
		return billingService.summarizePayments(search, method, from, to);
	}

	@PostMapping("/{id}/refund")
	@PreAuthorize("hasAuthority('PAYMENT_CREATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public PaymentResponse refund(@PathVariable UUID id, @Valid @RequestBody PaymentRefundRequest request) {
		return billingService.refundPayment(id, request);
	}
}
