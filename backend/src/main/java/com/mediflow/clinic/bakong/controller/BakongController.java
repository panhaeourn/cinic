package com.mediflow.clinic.bakong.controller;

import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mediflow.clinic.bakong.dto.BakongCheckRequest;
import com.mediflow.clinic.bakong.dto.BakongMerchantConfigResponse;
import com.mediflow.clinic.bakong.dto.BakongQrRequest;
import com.mediflow.clinic.bakong.dto.BakongQrResponse;
import com.mediflow.clinic.bakong.service.BakongService;

@RestController
@RequestMapping("/api/bakong")
public class BakongController {

	private final BakongService bakongService;

	public BakongController(BakongService bakongService) {
		this.bakongService = bakongService;
	}

	@GetMapping("/merchant")
	@PreAuthorize("hasAuthority('INVOICE_VIEW') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public BakongMerchantConfigResponse merchant() {
		return bakongService.getMerchantConfig();
	}

	@PostMapping("/qr")
	@PreAuthorize("hasAuthority('PAYMENT_CREATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public BakongQrResponse qr(@Valid @RequestBody BakongQrRequest request) {
		return bakongService.generateIndividualKhqr(request.amount(), request.expirySeconds());
	}

	@PostMapping("/check-md5")
	@PreAuthorize("hasAuthority('PAYMENT_CREATE') and hasAnyRole('ADMIN', 'RECEPTIONIST_CASHIER')")
	public Map<String, Object> check(@Valid @RequestBody BakongCheckRequest request) {
		return bakongService.checkTransactionByMd5(request.md5());
	}
}
