package com.mediflow.clinic.billing.mapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mediflow.clinic.billing.dto.InvoiceCreateRequest;
import com.mediflow.clinic.billing.dto.InvoiceItemRequest;
import com.mediflow.clinic.billing.dto.InvoiceItemResponse;
import com.mediflow.clinic.billing.dto.InvoiceResponse;
import com.mediflow.clinic.billing.dto.PaymentCreateRequest;
import com.mediflow.clinic.billing.dto.PaymentResponse;
import com.mediflow.clinic.billing.dto.ReceiptResponse;
import com.mediflow.clinic.billing.entity.Invoice;
import com.mediflow.clinic.billing.entity.InvoiceItem;
import com.mediflow.clinic.billing.entity.InvoiceItemType;
import com.mediflow.clinic.billing.entity.Payment;
import com.mediflow.clinic.patient.entity.Patient;
import com.mediflow.clinic.user.entity.User;

@Component
public class BillingMapper {

	public Invoice toInvoice(InvoiceCreateRequest request, Patient patient) {
		Invoice invoice = new Invoice();
		invoice.setPatient(patient);
		invoice.setDiscountAmount(moneyOrZero(request.discountAmount()));
		invoice.setTaxAmount(moneyOrZero(request.taxAmount()));
		invoice.setNotes(normalizeOptional(request.notes()));
		invoice.setDueAt(request.dueAt());
		request.items().stream()
			.map(this::toItem)
			.forEach(invoice::addItem);
		return invoice;
	}

	public InvoiceItem toItem(InvoiceItemRequest request) {
		InvoiceItem item = new InvoiceItem();
		item.setItemType(request.itemType() == null ? InvoiceItemType.SERVICE : request.itemType());
		item.setDescription(request.description().trim());
		item.setQuantity(money(request.quantity()));
		item.setUnitPrice(money(request.unitPrice()));
		item.setLineTotal(money(request.quantity().multiply(request.unitPrice())));
		return item;
	}

	public Payment toPayment(PaymentCreateRequest request) {
		Payment payment = new Payment();
		payment.setMethod(request.method());
		payment.setAmount(money(request.amount()));
		payment.setReferenceNumber(normalizeOptional(request.referenceNumber()));
		payment.setNote(normalizeOptional(request.note()));
		if (request.paidAt() != null) {
			payment.setPaidAt(request.paidAt());
		}
		return payment;
	}

	public InvoiceResponse toResponse(Invoice invoice) {
		Patient patient = invoice.getPatient();
		return new InvoiceResponse(
			invoice.getId(),
			invoice.getInvoiceNumber(),
			patient.getId(),
			patient.getPatientCode(),
			patient.getFirstName() + " " + patient.getLastName(),
			invoice.getStatus(),
			invoice.getSubtotal(),
			invoice.getDiscountAmount(),
			invoice.getTaxAmount(),
			invoice.getTotalAmount(),
			invoice.getPaidAmount(),
			invoice.getBalanceAmount(),
			invoice.getNotes(),
			invoice.getIssuedAt(),
			invoice.getDueAt(),
			invoice.getItems().stream().map(this::toItemResponse).toList(),
			invoice.getPayments().stream().map(this::toPaymentResponse).toList(),
			invoice.getCreatedAt(),
			invoice.getUpdatedAt()
		);
	}

	public InvoiceItemResponse toItemResponse(InvoiceItem item) {
		return new InvoiceItemResponse(
			item.getId(),
			item.getItemType(),
			item.getDescription(),
			item.getQuantity(),
			item.getUnitPrice(),
			item.getLineTotal(),
			item.getCreatedAt()
		);
	}

	public PaymentResponse toPaymentResponse(Payment payment) {
		Invoice invoice = payment.getInvoice();
		Patient patient = invoice.getPatient();
		User receivedBy = payment.getReceivedBy();
		return new PaymentResponse(
			payment.getId(),
			invoice.getId(),
			invoice.getInvoiceNumber(),
			patient.getPatientCode(),
			patient.getFirstName() + " " + patient.getLastName(),
			payment.getPaymentNumber(),
			payment.getMethod(),
			payment.getAmount(),
			money(payment.getRefundedAmount()),
			money(payment.getNetAmount()),
			receivedBy == null ? null : receivedBy.getId(),
			receivedBy == null ? "Unassigned cashier" : receivedBy.getFullName(),
			receivedBy == null ? null : receivedBy.getEmail(),
			payment.getReferenceNumber(),
			payment.getNote(),
			payment.getRefundReason(),
			payment.getRefundedAt(),
			payment.getPaidAt(),
			payment.getCreatedAt()
		);
	}

	public ReceiptResponse toReceipt(Invoice invoice) {
		Patient patient = invoice.getPatient();
		List<PaymentResponse> payments = invoice.getPayments().stream().map(this::toPaymentResponse).toList();
		return new ReceiptResponse(
			invoice.getId(),
			invoice.getInvoiceNumber(),
			patient.getPatientCode(),
			patient.getFirstName() + " " + patient.getLastName(),
			invoice.getTotalAmount(),
			invoice.getPaidAmount(),
			invoice.getBalanceAmount(),
			payments,
			invoice.getIssuedAt()
		);
	}

	public BigDecimal money(BigDecimal value) {
		return value.setScale(2, RoundingMode.HALF_UP);
	}

	private BigDecimal moneyOrZero(BigDecimal value) {
		return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : money(value);
	}

	private String normalizeOptional(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
