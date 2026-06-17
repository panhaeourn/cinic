package com.mediflow.clinic.bakong.service;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import com.mediflow.clinic.bakong.dto.BakongMerchantConfigResponse;
import com.mediflow.clinic.bakong.dto.BakongQrResponse;
import com.mediflow.clinic.common.exception.ApiException;
import com.mediflow.clinic.settings.entity.ClinicSettings;
import com.mediflow.clinic.settings.repository.ClinicSettingsRepository;

import kh.gov.nbc.bakong_khqr.BakongKHQR;
import kh.gov.nbc.bakong_khqr.model.IndividualInfo;
import kh.gov.nbc.bakong_khqr.model.KHQRData;
import kh.gov.nbc.bakong_khqr.model.KHQRResponse;
import kh.gov.nbc.bakong_khqr.model.KHQRCurrency;

@Service
public class BakongService {

	@Value("${bakong.base-url:https://api-bakong.nbc.gov.kh}")
	private String baseUrl;

	@Value("${bakong.alternative-base-urls:}")
	private String alternativeBaseUrls;

	@Value("${bakong.token:}")
	private String token;

	@Value("${bakong.api-key:}")
	private String apiKey;

	@Value("${bakong.merchant.bakong-account-id:}")
	private String merchantBakongAccountId;

	@Value("${bakong.merchant.name:MediFlex Clinic}")
	private String merchantName;

	@Value("${bakong.merchant.city:Phnom Penh}")
	private String merchantCity;

	@Value("${bakong.merchant.account-information:}")
	private String accountInformation;

	@Value("${bakong.merchant.acquiring-bank:Bakong}")
	private String acquiringBank;

	@Value("${bakong.qr-expiry-seconds:200}")
	private long qrExpirySeconds;

	@Value("${bakong.currency:USD}")
	private String bakongCurrency;

	private final RestTemplate restTemplate;
	private final ClinicSettingsRepository clinicSettingsRepository;

	public BakongService(ClinicSettingsRepository clinicSettingsRepository) {
		this.clinicSettingsRepository = clinicSettingsRepository;
		SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(5000);
		factory.setReadTimeout(8000);
		this.restTemplate = new RestTemplate(factory);
	}

	public BakongMerchantConfigResponse getMerchantConfig() {
		ClinicSettings settings = currentSettings();
		return new BakongMerchantConfigResponse(
			valueOrFallback(settings == null ? null : settings.getBakongAccountId(), merchantBakongAccountId),
			valueOrFallback(settings == null ? null : settings.getBakongMerchantName(), merchantName),
			valueOrFallback(settings == null ? null : settings.getBakongMerchantCity(), merchantCity),
			acquiringBank,
			normalizedCurrency(settings),
			(int) qrExpirySeconds
		);
	}

	public BakongQrResponse generateIndividualKhqr(BigDecimal amount, Long requestedExpirySeconds) {
		if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "KHQR amount must be greater than zero.");
		}
		ensureMerchantConfigured();

		long expirySeconds = requestedExpirySeconds == null || requestedExpirySeconds <= 0 ? qrExpirySeconds : requestedExpirySeconds;
		ClinicSettings settings = currentSettings();
		IndividualInfo info = new IndividualInfo();
		info.setBakongAccountId(valueOrFallback(settings == null ? null : settings.getBakongAccountId(), merchantBakongAccountId));
		info.setAccountInformation(valueOrFallback(settings == null ? null : settings.getBakongAccountInformation(), accountInformation));
		info.setAcquiringBank(acquiringBank);
		info.setCurrency(resolveKhqrCurrency(settings));
		info.setAmount(amount.doubleValue());
		info.setMerchantName(valueOrFallback(settings == null ? null : settings.getBakongMerchantName(), merchantName));
		info.setMerchantCity(valueOrFallback(settings == null ? null : settings.getBakongMerchantCity(), merchantCity));

		long expiryMs = System.currentTimeMillis() + (expirySeconds * 1000L);
		setExpiryIfSupported(info, expiryMs);

		KHQRResponse<KHQRData> response = BakongKHQR.generateIndividual(info);
		if (response.getKHQRStatus() == null || response.getKHQRStatus().getCode() != 0) {
			String message = response.getKHQRStatus() == null ? "Unknown KHQR error" : response.getKHQRStatus().getMessage();
			throw new ApiException(HttpStatus.BAD_REQUEST, "Bakong KHQR failed: " + message);
		}

		KHQRData data = response.getData();
		if (data == null || data.getQr() == null || data.getQr().isBlank()) {
			throw new ApiException(HttpStatus.BAD_GATEWAY, "Bakong SDK returned empty QR data.");
		}

		return new BakongQrResponse(true, amount, data.getQr(), data.getMd5(), expiryMs, expirySeconds);
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> checkTransactionByMd5(String md5) {
		if (md5 == null || md5.isBlank()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "md5 is required.");
		}
		if (token == null || token.isBlank()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Bakong verification token is missing on the server.");
		}

		ApiException lastError = null;
		for (String candidateBaseUrl : resolveBakongBaseUrls()) {
			try {
				HttpEntity<Map<String, Object>> request = new HttpEntity<>(Map.of("md5", md5), createBakongJsonHeaders());
				ResponseEntity<Map> response = restTemplate.exchange(
					candidateBaseUrl + "/v1/check_transaction_by_md5",
					HttpMethod.POST,
					request,
					Map.class
				);
				Map<String, Object> check = new HashMap<>();
				check.put("success", true);
				check.put("data", response.getBody());
				boolean paid = isBakongPaid(check);
				Map<String, Object> out = new HashMap<>();
				out.put("success", true);
				out.put("md5", md5);
				out.put("data", response.getBody());
				out.put("sourceUrl", candidateBaseUrl);
				out.put("paid", paid);
				out.put("status", paid ? "PAID" : "PENDING");
				out.put("verificationPending", !paid);
				return out;
			} catch (RestClientResponseException ex) {
				int statusCode = ex.getStatusCode().value();
				lastError = new ApiException(HttpStatus.BAD_GATEWAY, buildBakongVerificationMessage(statusCode, ex.getResponseBodyAsString()));
				if (shouldTryAnotherBakongHost(statusCode)) {
					continue;
				}
				throw lastError;
			} catch (RuntimeException ex) {
				lastError = new ApiException(HttpStatus.BAD_GATEWAY, "Unable to verify Bakong payment right now.");
			}
		}

		throw lastError == null ? new ApiException(HttpStatus.BAD_GATEWAY, "Unable to verify Bakong payment right now.") : lastError;
	}

	private HttpHeaders createBakongJsonHeaders() {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.setAccept(List.of(MediaType.APPLICATION_JSON));
		headers.set(HttpHeaders.USER_AGENT, "MediFlexClinic/1.0");
		if (token != null && !token.isBlank()) {
			headers.setBearerAuth(token);
		}
		if (apiKey != null && !apiKey.isBlank()) {
			headers.set("x-api-key", apiKey);
		}
		return headers;
	}

	private void ensureMerchantConfigured() {
		ClinicSettings settings = currentSettings();
		String resolvedAccountId = valueOrFallback(settings == null ? null : settings.getBakongAccountId(), merchantBakongAccountId);
		String resolvedAccountInfo = valueOrFallback(settings == null ? null : settings.getBakongAccountInformation(), accountInformation);
		String resolvedMerchantName = valueOrFallback(settings == null ? null : settings.getBakongMerchantName(), merchantName);
		if (resolvedAccountId == null || resolvedAccountId.isBlank()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Bakong merchant account id is not configured.");
		}
		if (resolvedAccountInfo == null || resolvedAccountInfo.isBlank()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Bakong merchant account information is not configured.");
		}
		if (resolvedMerchantName == null || resolvedMerchantName.isBlank()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Bakong merchant name is not configured.");
		}
	}

	private void setExpiryIfSupported(IndividualInfo info, long expiryMs) {
		tryCall(info, "setExpirationTimestamp", expiryMs);
		tryCall(info, "setExpirationTime", expiryMs);
		tryCall(info, "setTimestamp", expiryMs);
		tryCall(info, "setExpireTimestamp", expiryMs);
		tryCall(info, "setExpirationTimestamp", String.valueOf(expiryMs));
		tryCall(info, "setExpirationTime", String.valueOf(expiryMs));
		tryCall(info, "setTimestamp", String.valueOf(expiryMs));
		tryCall(info, "setExpireTimestamp", String.valueOf(expiryMs));
	}

	private boolean tryCall(Object target, String methodName, Object value) {
		for (Method method : target.getClass().getMethods()) {
			if (!method.getName().equals(methodName) || method.getParameterCount() != 1) {
				continue;
			}
			Class<?> parameterType = method.getParameterTypes()[0];
			try {
				if (value instanceof Long longValue && (parameterType == long.class || parameterType == Long.class)) {
					method.invoke(target, longValue);
					return true;
				}
				if (value instanceof String textValue && parameterType == String.class) {
					method.invoke(target, textValue);
					return true;
				}
			} catch (ReflectiveOperationException ignored) {
				return false;
			}
		}
		return false;
	}

	private String buildBakongVerificationMessage(int statusCode, String responseBody) {
		String body = responseBody == null ? "" : responseBody.toLowerCase();
		if (body.contains("cloudfront") || body.contains("request blocked")) {
			return "Bakong verification is blocked from the server right now (HTTP " + statusCode + ").";
		}
		if (statusCode == 401 || statusCode == 403) {
			return "Bakong verification was denied (HTTP " + statusCode + ").";
		}
		if (statusCode >= 500) {
			return "Bakong verification is temporarily unavailable (HTTP " + statusCode + ").";
		}
		return "Bakong verification failed (HTTP " + statusCode + ").";
	}

	private boolean shouldTryAnotherBakongHost(int statusCode) {
		return statusCode == 401 || statusCode == 403 || statusCode >= 500;
	}

	private boolean isBakongPaid(Map<String, Object> check) {
		if (check == null) {
			return false;
		}
		Object successObj = check.get("success");
		if (successObj instanceof Boolean success && !success) {
			return false;
		}
		Object dataObj = check.get("data");
		if (dataObj == null) {
			return false;
		}
		if (dataObj instanceof Map<?, ?> dataMap) {
			Object responseCode = dataMap.get("responseCode");
			if (responseCode != null) {
				String normalizedCode = String.valueOf(responseCode).trim();
				if (!"0".equals(normalizedCode)) {
					return false;
				}
				if (dataMap.get("data") != null) {
					return true;
				}
			}
			Object errorCode = dataMap.get("errorCode");
			if (errorCode != null && !"0".equals(String.valueOf(errorCode).trim())) {
				return false;
			}
		}
		return containsPaidSignal(dataObj);
	}

	private boolean containsPaidSignal(Object value) {
		if (value == null) {
			return false;
		}
		String text = String.valueOf(value).toLowerCase();
		if (containsNegativePaymentSignal(text)) {
			return false;
		}
		if (containsPositivePaymentSignal(text)) {
			return true;
		}
		if (value instanceof Map<?, ?> map) {
			Boolean directDecision = detectPaidSignalFromMap(map);
			if (directDecision != null) {
				return directDecision;
			}
			for (Object item : map.values()) {
				if (containsPaidSignal(item)) {
					return true;
				}
			}
		}
		if (value instanceof Iterable<?> iterable) {
			for (Object item : iterable) {
				if (containsPaidSignal(item)) {
					return true;
				}
			}
		}
		return false;
	}

	private Boolean detectPaidSignalFromMap(Map<?, ?> map) {
		for (Map.Entry<?, ?> entry : map.entrySet()) {
			String key = String.valueOf(entry.getKey()).trim().toLowerCase();
			Object value = entry.getValue();
			if (value == null) {
				continue;
			}
			if (isPaidKey(key)) {
				Boolean result = asBoolean(value);
				if (result != null) {
					return result;
				}
			}
			if (isStatusKey(key)) {
				String normalized = String.valueOf(value).trim().toLowerCase();
				if (containsNegativePaymentSignal(normalized)) {
					return false;
				}
				if (containsPositivePaymentSignal(normalized)) {
					return true;
				}
			}
		}
		return null;
	}

	private boolean isPaidKey(String key) {
		return "paid".equals(key)
			|| "ispaid".equals(key)
			|| "paidstatus".equals(key)
			|| "ispaidstatus".equals(key)
			|| "completed".equals(key)
			|| "success".equals(key)
			|| "iscompleted".equals(key)
			|| "issuccess".equals(key);
	}

	private boolean isStatusKey(String key) {
		return key.contains("status")
			|| key.contains("state")
			|| key.contains("paymentstatus")
			|| key.contains("transactionstatus")
			|| key.contains("payment_state")
			|| key.contains("transaction_state");
	}

	private Boolean asBoolean(Object value) {
		if (value instanceof Boolean booleanValue) {
			return booleanValue;
		}
		String normalized = String.valueOf(value).trim().toLowerCase();
		if ("true".equals(normalized) || "1".equals(normalized) || "yes".equals(normalized)) {
			return true;
		}
		if ("false".equals(normalized) || "0".equals(normalized) || "no".equals(normalized)) {
			return false;
		}
		return null;
	}

	private boolean containsPositivePaymentSignal(String text) {
		return text.contains("paid")
			|| text.contains("completed")
			|| text.contains("approved")
			|| text.contains("settled")
			|| text.contains("success")
			|| text.contains("successful")
			|| text.contains("succeed")
			|| text.contains("done")
			|| text.contains("finished");
	}

	private boolean containsNegativePaymentSignal(String text) {
		return text.contains("pending")
			|| text.contains("processing")
			|| text.contains("initiated")
			|| text.contains("created")
			|| text.contains("expired")
			|| text.contains("cancelled")
			|| text.contains("canceled")
			|| text.contains("failed")
			|| text.contains("declined")
			|| text.contains("rejected")
			|| text.contains("unpaid");
	}

	private List<String> resolveBakongBaseUrls() {
		Set<String> orderedUrls = new LinkedHashSet<>();
		addBakongBaseUrl(orderedUrls, baseUrl);
		if (alternativeBaseUrls != null && !alternativeBaseUrls.isBlank()) {
			for (String raw : alternativeBaseUrls.split(",")) {
				addBakongBaseUrl(orderedUrls, raw);
			}
		}
		return new ArrayList<>(orderedUrls);
	}

	private void addBakongBaseUrl(Set<String> orderedUrls, String candidate) {
		if (candidate == null) {
			return;
		}
		String normalized = candidate.trim();
		while (normalized.endsWith("/")) {
			normalized = normalized.substring(0, normalized.length() - 1);
		}
		if (!normalized.isBlank()) {
			orderedUrls.add(normalized);
		}
	}

	private ClinicSettings currentSettings() {
		return clinicSettingsRepository.findById(ClinicSettings.DEFAULT_ID).orElse(null);
	}

	private String normalizedCurrency(ClinicSettings settings) {
		String currency = valueOrFallback(settings == null ? null : settings.getBakongCurrency(), bakongCurrency);
		return "KHR".equalsIgnoreCase(currency) ? "KHR" : "USD";
	}

	private KHQRCurrency resolveKhqrCurrency(ClinicSettings settings) {
		return "KHR".equals(normalizedCurrency(settings)) ? KHQRCurrency.KHR : KHQRCurrency.USD;
	}

	private String valueOrFallback(String primary, String fallback) {
		return primary == null || primary.isBlank() ? fallback : primary.trim();
	}
}
