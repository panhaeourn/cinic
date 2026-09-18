package com.mediflow.clinic.patient;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:patient_khmer_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
@WithMockUser(authorities = {"ROLE_ADMIN", "PATIENT_CREATE", "PATIENT_UPDATE", "PATIENT_VIEW"})
class PatientKhmerNameTests {
    @Autowired private MockMvc mvc;
    private String body(String nameField) {
        return """
            {"firstName":"Sample","lastName":"Patient","gender":"FEMALE",
             "dateOfBirth":"1995-01-01","phone":"012345678","address":"Sample address"%s}
            """.formatted(nameField);
    }
    @Test void khmerNamePersistsIsSearchableAndCanBeCleared() throws Exception {
        String result = mvc.perform(post("/api/patients").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content(body(",\"khmerName\":\"  សុខ ស្រីនាង  \"")))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.khmerName").value("សុខ ស្រីនាង"))
            .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        String id = new tools.jackson.databind.ObjectMapper().readTree(result).get("id").asText();
        mvc.perform(get("/api/patients/" + id)).andExpect(status().isOk())
            .andExpect(jsonPath("$.khmerName").value("សុខ ស្រីនាង"));
        mvc.perform(get("/api/patients").param("search", "ស្រីនាង"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(id));
        mvc.perform(put("/api/patients/" + id).with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content(body(",\"khmerName\":\"   \"")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.khmerName").isEmpty());
    }
    @Test void oldPayloadRemainsValidAndOverlongNameIsRejected() throws Exception {
        mvc.perform(post("/api/patients").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body("")))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.khmerName").isEmpty());
        mvc.perform(post("/api/patients").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content(body(",\"khmerName\":\"" + "ក".repeat(161) + "\"")))
            .andExpect(status().isBadRequest());
    }
}
