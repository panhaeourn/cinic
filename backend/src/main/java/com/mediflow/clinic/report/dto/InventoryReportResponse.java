package com.mediflow.clinic.report.dto;

public record InventoryReportResponse(
	long medicines,
	long lowStock,
	long expiringSoon,
	long inventoryTransactions
) {
}
