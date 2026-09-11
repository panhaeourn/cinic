package com.mediflow.clinic.department;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
	"spring.datasource.url=jdbc:h2:mem:department_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH",
	"spring.datasource.username=sa",
	"spring.datasource.password=",
	"spring.datasource.driver-class-name=org.h2.Driver",
	"spring.flyway.enabled=false",
	"spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class DepartmentIntegrationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	@WithMockUser(roles = "ADMIN")
	void adminCanManageDepartmentLifecycle() throws Exception {
		String created = mockMvc.perform(post("/api/departments")
			.with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
				{"name":"Cardiology","description":"Heart and vascular care","status":"ACTIVE"}
				"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.name").value("Cardiology"))
			.andReturn().getResponse().getContentAsString();

		String id = new tools.jackson.databind.ObjectMapper().readTree(created).get("id").asText();

		mockMvc.perform(put("/api/departments/{id}", id)
			.with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
				{"name":"Cardiology","description":"Cardiac services","status":"ACTIVE"}
				"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.description").value("Cardiac services"));

		mockMvc.perform(patch("/api/departments/{id}/status", id)
			.param("status", "INACTIVE")
			.with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("INACTIVE"));

		mockMvc.perform(get("/api/departments/manage"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].name").value("Cardiology"));

		mockMvc.perform(get("/api/departments"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$").isEmpty());
	}
}
