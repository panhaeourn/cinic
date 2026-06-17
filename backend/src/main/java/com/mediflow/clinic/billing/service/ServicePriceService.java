package com.mediflow.clinic.billing.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mediflow.clinic.billing.dto.ServicePriceRequest;
import com.mediflow.clinic.billing.dto.ServicePriceResponse;
import com.mediflow.clinic.billing.entity.ServicePrice;
import com.mediflow.clinic.billing.repository.ServicePriceRepository;
import com.mediflow.clinic.common.exception.ApiException;

@Service
public class ServicePriceService {

	private final ServicePriceRepository servicePriceRepository;

	public ServicePriceService(ServicePriceRepository servicePriceRepository) {
		this.servicePriceRepository = servicePriceRepository;
	}

	@Transactional(readOnly = true)
	public Page<ServicePriceResponse> findAll(String search, Boolean active, Pageable pageable) {
		String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
		return servicePriceRepository.findAll(filterSpec(normalizedSearch, active), pageable).map(this::toResponse);
	}

	@Transactional
	public ServicePriceResponse create(ServicePriceRequest request) {
		String code = request.code().trim().toUpperCase(Locale.ROOT);
		servicePriceRepository.findByCodeIgnoreCase(code).ifPresent(existing -> {
			throw new ApiException(HttpStatus.CONFLICT, "Service code already exists.");
		});

		ServicePrice servicePrice = new ServicePrice();
		applyRequest(servicePrice, request, code);
		return toResponse(servicePriceRepository.save(servicePrice));
	}

	@Transactional
	public ServicePriceResponse update(UUID id, ServicePriceRequest request) {
		ServicePrice servicePrice = findServicePrice(id);
		String code = request.code().trim().toUpperCase(Locale.ROOT);
		servicePriceRepository.findByCodeIgnoreCase(code)
			.filter(existing -> !existing.getId().equals(id))
			.ifPresent(existing -> {
				throw new ApiException(HttpStatus.CONFLICT, "Service code already exists.");
			});

		applyRequest(servicePrice, request, code);
		return toResponse(servicePrice);
	}

	@Transactional
	public ServicePriceResponse setActive(UUID id, boolean active) {
		ServicePrice servicePrice = findServicePrice(id);
		servicePrice.setActive(active);
		return toResponse(servicePrice);
	}

	private ServicePrice findServicePrice(UUID id) {
		return servicePriceRepository.findById(id)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Service price was not found."));
	}

	private void applyRequest(ServicePrice servicePrice, ServicePriceRequest request, String code) {
		servicePrice.setCode(code);
		servicePrice.setName(request.name().trim());
		servicePrice.setItemType(request.itemType());
		servicePrice.setCategory(request.category().trim());
		servicePrice.setPrice(money(request.price()));
		servicePrice.setActive(request.active() == null || request.active());
	}

	private ServicePriceResponse toResponse(ServicePrice servicePrice) {
		return new ServicePriceResponse(
			servicePrice.getId(),
			servicePrice.getCode(),
			servicePrice.getName(),
			servicePrice.getItemType(),
			servicePrice.getCategory(),
			money(servicePrice.getPrice()),
			servicePrice.isActive(),
			servicePrice.getCreatedAt(),
			servicePrice.getUpdatedAt()
		);
	}

	private Specification<ServicePrice> filterSpec(String search, Boolean active) {
		return (root, query, criteriaBuilder) -> {
			var predicate = criteriaBuilder.conjunction();
			if (active != null) {
				predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("active"), active));
			}
			if (search != null) {
				String pattern = "%" + search.toLowerCase(Locale.ROOT) + "%";
				predicate = criteriaBuilder.and(
					predicate,
					criteriaBuilder.or(
						criteriaBuilder.like(criteriaBuilder.lower(root.get("code")), pattern),
						criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
						criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), pattern)
					)
				);
			}
			return predicate;
		};
	}

	private BigDecimal money(BigDecimal value) {
		return value.setScale(2, RoundingMode.HALF_UP);
	}
}
