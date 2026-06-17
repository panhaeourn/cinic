package com.mediflow.clinic.report.service;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.report.dto.AppointmentReportResponse;
import com.mediflow.clinic.report.dto.CashierIncomeReportResponse;
import com.mediflow.clinic.report.dto.DoctorConsultationReportResponse;
import com.mediflow.clinic.report.dto.InventoryReportResponse;
import com.mediflow.clinic.report.dto.PatientReportResponse;
import com.mediflow.clinic.report.dto.PaymentMethodReportResponse;
import com.mediflow.clinic.report.dto.PaymentReportResponse;
import com.mediflow.clinic.report.dto.ReportRangeResponse;
import com.mediflow.clinic.report.dto.ReportSummaryResponse;
import com.mediflow.clinic.report.dto.RevenueDailyResponse;
import com.mediflow.clinic.report.dto.RevenueReportResponse;
import com.mediflow.clinic.report.dto.StatusCountResponse;

@Service
public class ReportService {

	private final EntityManager entityManager;

	public ReportService(EntityManager entityManager) {
		this.entityManager = entityManager;
	}

	@Transactional(readOnly = true)
	public ReportSummaryResponse summary(LocalDate from, LocalDate to) {
		LocalDate today = LocalDate.now(ZoneOffset.UTC);
		LocalDate startDate = from == null ? today.withDayOfMonth(1) : from;
		LocalDate endDate = to == null ? today : to;
		if (endDate.isBefore(startDate)) {
			endDate = startDate;
		}

		Instant start = startDate.atStartOfDay().toInstant(ZoneOffset.UTC);
		Instant endExclusive = endDate.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

		Object[] invoiceTotals = row("""
			select coalesce(sum(total_amount), 0), coalesce(sum(balance_amount), 0), count(*)
			from invoices
			where issued_at >= :start and issued_at < :end
		""", start, endExclusive);
		Object[] paymentTotals = row("""
			select coalesce(sum(amount), 0), coalesce(sum(refunded_amount), 0), coalesce(sum(amount - refunded_amount), 0), count(*)
			from payments
			where paid_at >= :start and paid_at < :end
		""", start, endExclusive);

		RevenueReportResponse revenue = new RevenueReportResponse(
			decimal(invoiceTotals[0]),
			decimal(invoiceTotals[1]),
			decimal(paymentTotals[0]),
			decimal(paymentTotals[1]),
			decimal(paymentTotals[2]),
			dailyRevenue(start, endExclusive)
		);

		PaymentReportResponse payments = new PaymentReportResponse(
			decimal(paymentTotals[0]),
			decimal(paymentTotals[1]),
			decimal(paymentTotals[2]),
			number(paymentTotals[3]),
			paymentMethods(start, endExclusive),
			cashierIncome(start, endExclusive)
		);

		return new ReportSummaryResponse(
			new ReportRangeResponse(startDate, endDate),
			revenue,
			patientReport(start, endExclusive),
			appointmentReport(start, endExclusive),
			doctorConsultations(start, endExclusive),
			inventoryReport(),
			payments
		);
	}

	private PatientReportResponse patientReport(Instant start, Instant end) {
		long totalPatients = number(scalar("select count(*) from patients"));
		long newPatients = number(scalar("""
			select count(*) from patients where created_at >= :start and created_at < :end
		""", start, end));
		long portalLinked = number(scalar("select count(*) from patients where user_id is not null"));
		return new PatientReportResponse(totalPatients, newPatients, portalLinked);
	}

	private AppointmentReportResponse appointmentReport(Instant start, Instant end) {
		long total = number(scalar("""
			select count(*) from appointments where scheduled_at >= :start and scheduled_at < :end
		""", start, end));
		List<StatusCountResponse> statuses = list("""
			select status, count(*)
			from appointments
			where scheduled_at >= :start and scheduled_at < :end
			group by status
			order by status
		""", start, end).stream()
			.map(row -> new StatusCountResponse((String) row[0], number(row[1])))
			.toList();
		return new AppointmentReportResponse(total, statuses);
	}

	private List<DoctorConsultationReportResponse> doctorConsultations(Instant start, Instant end) {
		return list("""
			select coalesce(s.staff_code, 'UNASSIGNED'),
			       coalesce(trim(concat(s.first_name, ' ', s.last_name)), 'Unassigned doctor'),
			       count(e.id)
			from encounters e
			left join staff s on s.id = e.doctor_id
			where e.status = 'COMPLETED' and e.completed_at >= :start and e.completed_at < :end
			group by s.staff_code, s.first_name, s.last_name
			order by count(e.id) desc
			limit 8
		""", start, end).stream()
			.map(row -> new DoctorConsultationReportResponse((String) row[0], (String) row[1], number(row[2])))
			.toList();
	}

	private List<RevenueDailyResponse> dailyRevenue(Instant start, Instant end) {
		return list("""
			select cast(paid_at as date),
			       coalesce(sum(amount), 0),
			       coalesce(sum(refunded_amount), 0),
			       coalesce(sum(amount - refunded_amount), 0)
			from payments
			where paid_at >= :start and paid_at < :end
			group by cast(paid_at as date)
			order by cast(paid_at as date)
		""", start, end).stream()
			.map(row -> new RevenueDailyResponse(date(row[0]), decimal(row[1]), decimal(row[2]), decimal(row[3])))
			.toList();
	}

	private List<PaymentMethodReportResponse> paymentMethods(Instant start, Instant end) {
		return list("""
			select method,
			       coalesce(sum(amount), 0),
			       coalesce(sum(refunded_amount), 0),
			       coalesce(sum(amount - refunded_amount), 0),
			       count(*)
			from payments
			where paid_at >= :start and paid_at < :end
			group by method
			order by method
		""", start, end).stream()
			.map(row -> new PaymentMethodReportResponse(
				(String) row[0],
				decimal(row[1]),
				decimal(row[2]),
				decimal(row[3]),
				number(row[4])
			))
			.toList();
	}

	private List<CashierIncomeReportResponse> cashierIncome(Instant start, Instant end) {
		return list("""
			select u.id,
			       coalesce(u.full_name, 'Unassigned cashier'),
			       u.email,
			       coalesce(sum(p.amount), 0),
			       coalesce(sum(p.refunded_amount), 0),
			       coalesce(sum(p.amount - p.refunded_amount), 0),
			       count(*)
			from payments p
			left join users u on u.id = p.received_by_user_id
			where p.paid_at >= :start and p.paid_at < :end
			group by u.id, u.full_name, u.email
			order by coalesce(sum(p.amount - p.refunded_amount), 0) desc
		""", start, end).stream()
			.map(row -> new CashierIncomeReportResponse(
				uuid(row[0]),
				(String) row[1],
				(String) row[2],
				decimal(row[3]),
				decimal(row[4]),
				decimal(row[5]),
				number(row[6])
			))
			.toList();
	}

	private InventoryReportResponse inventoryReport() {
		return new InventoryReportResponse(0, 0, 0, 0);
	}

	private Object[] row(String sql, Instant start, Instant end) {
		return (Object[]) query(sql, start, end).getSingleResult();
	}

	private Object scalar(String sql) {
		return entityManager.createNativeQuery(sql).getSingleResult();
	}

	private Object scalar(String sql, Instant start, Instant end) {
		return query(sql, start, end).getSingleResult();
	}

	@SuppressWarnings("unchecked")
	private List<Object[]> list(String sql, Instant start, Instant end) {
		return query(sql, start, end).getResultList();
	}

	private Query query(String sql, Instant start, Instant end) {
		return entityManager.createNativeQuery(sql)
			.setParameter("start", start)
			.setParameter("end", end);
	}

	private BigDecimal decimal(Object value) {
		if (value instanceof BigDecimal decimal) {
			return decimal;
		}
		if (value instanceof Number number) {
			return BigDecimal.valueOf(number.doubleValue());
		}
		return BigDecimal.ZERO;
	}

	private long number(Object value) {
		return value instanceof Number number ? number.longValue() : 0L;
	}

	private LocalDate date(Object value) {
		if (value instanceof Date date) {
			return date.toLocalDate();
		}
		return LocalDate.parse(String.valueOf(value));
	}

	private UUID uuid(Object value) {
		return value == null ? null : UUID.fromString(String.valueOf(value));
	}
}
