package com.mediflow.clinic.audit.service;

import java.time.Instant;
import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.audit.dto.AuditLogResponse;
import com.mediflow.clinic.audit.entity.AuditLog;
import com.mediflow.clinic.audit.repository.AuditLogRepository;
import com.mediflow.clinic.auth.security.ClinicUserDetailsService.ClinicUserPrincipal;
import com.mediflow.clinic.user.entity.User;

@Service
public class AuditService {

	private final AuditLogRepository auditLogRepository;

	public AuditService(AuditLogRepository auditLogRepository) {
		this.auditLogRepository = auditLogRepository;
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void record(String module, String action, String entityType, String entityId, String details) {
		AuditLog log = new AuditLog();
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication != null && authentication.getPrincipal() instanceof ClinicUserPrincipal principal) {
			User actor = principal.getUser();
			log.setActorEmail(actor.getEmail());
			log.setActorName(actor.getFullName());
		}
		log.setModule(module);
		log.setAction(action);
		log.setEntityType(entityType);
		log.setEntityId(entityId);
		log.setDetails(details);
		auditLogRepository.save(log);
	}

	@Transactional(readOnly = true)
	public Page<AuditLogResponse> findAll(
		String user,
		String module,
		String action,
		Instant from,
		Instant to,
		Pageable pageable
	) {
		return auditLogRepository.findAll(filters(user, module, action, from, to), pageable).map(this::toResponse);
	}

	private Specification<AuditLog> filters(String user, String module, String action, Instant from, Instant to) {
		return (root, query, cb) -> {
			var predicate = cb.conjunction();
			if (user != null && !user.isBlank()) {
				String pattern = "%" + user.toLowerCase(Locale.ROOT).trim() + "%";
				predicate = cb.and(predicate, cb.or(
					cb.like(cb.lower(root.get("actorEmail")), pattern),
					cb.like(cb.lower(root.get("actorName")), pattern)
				));
			}
			if (module != null && !module.isBlank()) {
				predicate = cb.and(predicate, cb.equal(root.get("module"), module.trim().toUpperCase(Locale.ROOT)));
			}
			if (action != null && !action.isBlank()) {
				predicate = cb.and(predicate, cb.equal(root.get("action"), action.trim().toUpperCase(Locale.ROOT)));
			}
			if (from != null) {
				predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), from));
			}
			if (to != null) {
				predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("createdAt"), to));
			}
			return predicate;
		};
	}

	private AuditLogResponse toResponse(AuditLog log) {
		return new AuditLogResponse(
			log.getId(),
			log.getActorEmail(),
			log.getActorName(),
			log.getModule(),
			log.getAction(),
			log.getEntityType(),
			log.getEntityId(),
			log.getDetails(),
			log.getCreatedAt()
		);
	}
}
