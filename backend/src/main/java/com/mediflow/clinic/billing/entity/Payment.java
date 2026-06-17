package com.mediflow.clinic.billing.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import com.mediflow.clinic.user.entity.User;

@Entity
@Table(name = "payments")
public class Payment {

	@Id
	@GeneratedValue
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "invoice_id", nullable = false)
	private Invoice invoice;

	@Column(nullable = false, unique = true, length = 24)
	private String paymentNumber;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private PaymentMethod method;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal amount;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal refundedAmount = BigDecimal.ZERO;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "received_by_user_id")
	private User receivedBy;

	@Column(length = 120)
	private String referenceNumber;

	@Column(columnDefinition = "TEXT")
	private String note;

	@Column(columnDefinition = "TEXT")
	private String refundReason;

	private Instant refundedAt;

	@Column(nullable = false)
	private Instant paidAt = Instant.now();

	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@PrePersist
	void onCreate() {
		if (paidAt == null) {
			paidAt = Instant.now();
		}
	}

	public UUID getId() {
		return id;
	}

	public Invoice getInvoice() {
		return invoice;
	}

	public void setInvoice(Invoice invoice) {
		this.invoice = invoice;
	}

	public String getPaymentNumber() {
		return paymentNumber;
	}

	public void setPaymentNumber(String paymentNumber) {
		this.paymentNumber = paymentNumber;
	}

	public PaymentMethod getMethod() {
		return method;
	}

	public void setMethod(PaymentMethod method) {
		this.method = method;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public void setAmount(BigDecimal amount) {
		this.amount = amount;
	}

	public BigDecimal getRefundedAmount() {
		return refundedAmount == null ? BigDecimal.ZERO : refundedAmount;
	}

	public void setRefundedAmount(BigDecimal refundedAmount) {
		this.refundedAmount = refundedAmount;
	}

	public User getReceivedBy() {
		return receivedBy;
	}

	public void setReceivedBy(User receivedBy) {
		this.receivedBy = receivedBy;
	}

	public BigDecimal getNetAmount() {
		return getAmount().subtract(getRefundedAmount());
	}

	public String getReferenceNumber() {
		return referenceNumber;
	}

	public void setReferenceNumber(String referenceNumber) {
		this.referenceNumber = referenceNumber;
	}

	public String getNote() {
		return note;
	}

	public void setNote(String note) {
		this.note = note;
	}

	public String getRefundReason() {
		return refundReason;
	}

	public void setRefundReason(String refundReason) {
		this.refundReason = refundReason;
	}

	public Instant getRefundedAt() {
		return refundedAt;
	}

	public void setRefundedAt(Instant refundedAt) {
		this.refundedAt = refundedAt;
	}

	public Instant getPaidAt() {
		return paidAt;
	}

	public void setPaidAt(Instant paidAt) {
		this.paidAt = paidAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
