package com.mediflow.clinic.billing.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.mediflow.clinic.billing.entity.ServicePrice;

public interface ServicePriceRepository extends JpaRepository<ServicePrice, UUID>, JpaSpecificationExecutor<ServicePrice> {
	Optional<ServicePrice> findByCodeIgnoreCase(String code);
}
