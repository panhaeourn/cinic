package com.mediflow.clinic.billing.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.auth.security.ClinicUserDetailsService.ClinicUserPrincipal;
import com.mediflow.clinic.billing.dto.InvoiceCreateRequest;
import com.mediflow.clinic.billing.dto.InvoiceItemRequest;
import com.mediflow.clinic.billing.dto.InvoiceResponse;
import com.mediflow.clinic.billing.dto.PaymentCreateRequest;
import com.mediflow.clinic.billing.dto.PaymentRefundRequest;
import com.mediflow.clinic.billing.dto.PaymentResponse;
import com.mediflow.clinic.billing.dto.ReceiptResponse;
import com.mediflow.clinic.billing.entity.Invoice;
import com.mediflow.clinic.billing.entity.InvoiceItem;
import com.mediflow.clinic.billing.entity.InvoiceStatus;
import com.mediflow.clinic.billing.entity.Payment;
import com.mediflow.clinic.billing.entity.PaymentMethod;
import com.mediflow.clinic.billing.mapper.BillingMapper;
import com.mediflow.clinic.billing.repository.InvoiceRepository;
import com.mediflow.clinic.billing.repository.PaymentRepository;
import com.mediflow.clinic.common.code.CodeGeneratorService;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.patient.entity.Patient;
import com.mediflow.clinic.patient.repository.PatientRepository;
import com.mediflow.clinic.user.entity.User;

@Service
public class BillingService {

	private final InvoiceRepository invoiceRepository;
	private final PaymentRepository paymentRepository;
	private final PatientRepository patientRepository;
	private final BillingMapper billingMapper;
	private final CodeGeneratorService codeGeneratorService;

	public BillingService(
		InvoiceRepository invoiceRepository,
		PaymentRepository paymentRepository,
		PatientRepository patientRepository,
		BillingMapper billingMapper,
		CodeGeneratorService codeGeneratorService
	) {
		this.invoiceRepository = invoiceRepository;
		this.paymentRepository = paymentRepository;
		this.patientRepository = patientRepository;
		this.billingMapper = billingMapper;
		this.codeGeneratorService = codeGeneratorService;
	}

	@Transactional
	public InvoiceResponse create(InvoiceCreateRequest request) {
		Patient patient = findPatient(request.patientId());
		Invoice invoice = billingMapper.toInvoice(request, patient);
		invoice.setInvoiceNumber(codeGeneratorService.nextInvoiceNumber());
		recalculate(invoice);
		return billingMapper.toResponse(invoiceRepository.save(invoice));
	}

	@Transactional(readOnly = true)
	public Page<InvoiceResponse> findAll(String search, InvoiceStatus status, UUID patientId, Pageable pageable) {
		String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
		Specification<Invoice> specification = filterSpec(normalizedSearch, status, patientId);
		return invoiceRepository.findAll(specification, pageable).map(billingMapper::toResponse);
	}

	@Transactional(readOnly = true)
	public InvoiceResponse findById(UUID id) {
		return billingMapper.toResponse(findInvoice(id));
	}

	@Transactional
	public InvoiceResponse addItem(UUID invoiceId, InvoiceItemRequest request) {
		Invoice invoice = findInvoice(invoiceId);
		ensureInvoiceCanChangeItems(invoice);
		InvoiceItem item = billingMapper.toItem(request);
		invoice.addItem(item);
		recalculate(invoice);
		return billingMapper.toResponse(invoiceRepository.save(invoice));
	}

	@Transactional
	public PaymentResponse recordPayment(UUID invoiceId, PaymentCreateRequest request) {
		Invoice invoice = findInvoice(invoiceId);
		ensureInvoiceCanReceivePayment(invoice);
		BigDecimal amount = billingMapper.money(request.amount());
		if (amount.compareTo(invoice.getBalanceAmount()) > 0) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Payment amount cannot exceed invoice balance.");
		}

		Payment payment = billingMapper.toPayment(request);
		payment.setPaymentNumber(codeGeneratorService.nextPaymentNumber());
		payment.setReceivedBy(currentUser());
		invoice.addPayment(payment);
		recalculate(invoice);
		invoiceRepository.save(invoice);
		return billingMapper.toPaymentResponse(payment);
	}

	@Transactional(readOnly = true)
	public Page<PaymentResponse> findPayments(String search, PaymentMethod method, Instant from, Instant to, Pageable pageable) {
		String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
		Specification<Payment> specification = paymentFilterSpec(normalizedSearch, method, from, to);
		return paymentRepository.findAll(specification, pageable).map(billingMapper::toPaymentResponse);
	}

	@Transactional
	public PaymentResponse refundPayment(UUID paymentId, PaymentRefundRequest request) {
		Payment payment = findPayment(paymentId);
		BigDecimal amount = billingMapper.money(request.amount());
		BigDecimal refundableAmount = billingMapper.money(payment.getAmount().subtract(payment.getRefundedAmount()));
		if (amount.compareTo(refundableAmount) > 0) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Refund amount cannot exceed the remaining refundable payment amount.");
		}

		payment.setRefundedAmount(billingMapper.money(payment.getRefundedAmount().add(amount)));
		payment.setRefundReason(normalizeOptional(request.reason()));
		payment.setRefundedAt(Instant.now());
		recalculate(payment.getInvoice());
		return billingMapper.toPaymentResponse(payment);
	}

	@Transactional(readOnly = true)
	public ReceiptResponse receipt(UUID invoiceId) {
		Invoice invoice = findInvoice(invoiceId);
		if (invoice.getPayments().isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Receipt is available after at least one payment.");
		}
		return billingMapper.toReceipt(invoice);
	}

	private Patient findPatient(UUID id) {
		return patientRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Patient was not found."));
	}

	private Invoice findInvoice(UUID id) {
		return invoiceRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invoice was not found."));
	}

	private Payment findPayment(UUID id) {
		return paymentRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment was not found."));
	}

	private void ensureInvoiceCanChangeItems(Invoice invoice) {
		if (invoice.getStatus() == InvoiceStatus.CANCELLED || invoice.getStatus() == InvoiceStatus.PAID) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Paid or cancelled invoices cannot be changed.");
		}
		if (!invoice.getPayments().isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Invoice items cannot be changed after payment is recorded.");
		}
	}

	private void ensureInvoiceCanReceivePayment(Invoice invoice) {
		if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Cancelled invoices cannot receive payments.");
		}
		if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getBalanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Invoice is already paid.");
		}
	}

	private void recalculate(Invoice invoice) {
		BigDecimal subtotal = invoice.getItems()
			.stream()
			.map(InvoiceItem::getLineTotal)
			.reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal paidAmount = invoice.getPayments()
			.stream()
			.map(Payment::getNetAmount)
			.reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal discount = invoice.getDiscountAmount() == null ? BigDecimal.ZERO : invoice.getDiscountAmount();
		BigDecimal tax = invoice.getTaxAmount() == null ? BigDecimal.ZERO : invoice.getTaxAmount();

		subtotal = billingMapper.money(subtotal);
		discount = billingMapper.money(discount);
		tax = billingMapper.money(tax);
		paidAmount = billingMapper.money(paidAmount);

		if (discount.compareTo(subtotal) > 0) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Discount cannot be greater than subtotal.");
		}

		BigDecimal total = billingMapper.money(subtotal.subtract(discount).add(tax));
		if (total.compareTo(BigDecimal.ZERO) <= 0) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Invoice total must be greater than zero.");
		}
		if (paidAmount.compareTo(total) > 0) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Paid amount cannot exceed invoice total.");
		}

		invoice.setSubtotal(subtotal);
		invoice.setDiscountAmount(discount);
		invoice.setTaxAmount(tax);
		invoice.setTotalAmount(total);
		invoice.setPaidAmount(paidAmount);
		invoice.setBalanceAmount(billingMapper.money(total.subtract(paidAmount)));

		if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
			return;
		}
		if (paidAmount.compareTo(BigDecimal.ZERO) == 0) {
			invoice.setStatus(InvoiceStatus.ISSUED);
		} else if (paidAmount.compareTo(total) >= 0) {
			invoice.setStatus(InvoiceStatus.PAID);
		} else {
			invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
		}
	}

	private Specification<Invoice> filterSpec(String search, InvoiceStatus status, UUID patientId) {
		return (root, query, criteriaBuilder) -> {
			if (query != null) {
				query.distinct(true);
			}

			var predicate = criteriaBuilder.conjunction();
			if (status != null) {
				predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("status"), status));
			}
			if (patientId != null) {
				predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("patient").get("id"), patientId));
			}
			if (search != null) {
				String pattern = "%" + search.toLowerCase(Locale.ROOT) + "%";
				Join<Invoice, Patient> patient = root.join("patient", JoinType.LEFT);
				predicate = criteriaBuilder.and(
					predicate,
					criteriaBuilder.or(
						criteriaBuilder.like(criteriaBuilder.lower(root.get("invoiceNumber")), pattern),
						criteriaBuilder.like(criteriaBuilder.lower(patient.get("patientCode")), pattern),
						criteriaBuilder.like(criteriaBuilder.lower(patient.get("firstName")), pattern),
						criteriaBuilder.like(criteriaBuilder.lower(patient.get("lastName")), pattern)
					)
				);
			}
			return predicate;
		};
	}

	private Specification<Payment> paymentFilterSpec(String search, PaymentMethod method, Instant from, Instant to) {
		return (root, query, criteriaBuilder) -> {
			if (query != null) {
				query.distinct(true);
			}

			var predicate = criteriaBuilder.conjunction();
			if (method != null) {
				predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("method"), method));
			}
			if (from != null) {
				predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("paidAt"), from));
			}
			if (to != null) {
				predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(root.get("paidAt"), to));
			}
			if (search != null) {
				String pattern = "%" + search.toLowerCase(Locale.ROOT) + "%";
				Join<Payment, Invoice> invoice = root.join("invoice", JoinType.LEFT);
				Join<Invoice, Patient> patient = invoice.join("patient", JoinType.LEFT);
				predicate = criteriaBuilder.and(
					predicate,
					criteriaBuilder.or(
						criteriaBuilder.like(criteriaBuilder.lower(root.get("paymentNumber")), pattern),
						criteriaBuilder.like(criteriaBuilder.lower(root.get("referenceNumber")), pattern),
						criteriaBuilder.like(criteriaBuilder.lower(invoice.get("invoiceNumber")), pattern),
						criteriaBuilder.like(criteriaBuilder.lower(patient.get("patientCode")), pattern),
						criteriaBuilder.like(criteriaBuilder.lower(patient.get("firstName")), pattern),
						criteriaBuilder.like(criteriaBuilder.lower(patient.get("lastName")), pattern)
					)
				);
			}
			return predicate;
		};
	}

	private String normalizeOptional(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}

	private User currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication != null && authentication.getPrincipal() instanceof ClinicUserPrincipal principal) {
			return principal.getUser();
		}
		return null;
	}
}
