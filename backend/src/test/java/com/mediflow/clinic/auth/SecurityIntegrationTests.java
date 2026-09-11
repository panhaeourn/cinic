package com.mediflow.clinic.auth;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
	"spring.datasource.url=jdbc:h2:mem:security_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH",
	"spring.datasource.username=sa",
	"spring.datasource.password=",
	"spring.datasource.driver-class-name=org.h2.Driver",
	"spring.flyway.enabled=false",
	"spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class SecurityIntegrationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void csrfBootstrapSetsCookieAndSecurityHeaders() throws Exception {
		mockMvc.perform(get("/api/auth/csrf"))
			.andExpect(status().isOk())
			.andExpect(cookie().exists("XSRF-TOKEN"))
			.andExpect(header().string("X-Content-Type-Options", "nosniff"))
			.andExpect(header().string("Content-Security-Policy", containsString("default-src 'none'")));
	}

	@Test
	void loginRejectsMissingCsrfToken() throws Exception {
		mockMvc.perform(post("/api/auth/login")
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
				{"email":"person@example.com","password":"WrongPassword1!"}
				"""))
			.andExpect(status().isForbidden());
	}

	@Test
	void loginWithCsrfReachesAuthentication() throws Exception {
		mockMvc.perform(post("/api/auth/login")
			.with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
				{"email":"person@example.com","password":"WrongPassword1!"}
				"""))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void unauthorizedResponseIsValidJson() throws Exception {
		mockMvc.perform(get("/api/patients/cursor"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.status").value(401))
			.andExpect(jsonPath("$.timestamp").exists());
	}
}
