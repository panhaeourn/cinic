package com.mediflow.clinic.realtime;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
 "spring.datasource.url=jdbc:h2:mem:events_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH",
 "spring.datasource.username=sa", "spring.datasource.password=", "spring.datasource.driver-class-name=org.h2.Driver",
 "spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class ClinicEventsTests {
 @Autowired MockMvc mvc;
 @Autowired ClinicEvents events;
 @Test void anonymousClientsCannotSubscribe() throws Exception {
  mvc.perform(get("/api/events")).andExpect(status().isUnauthorized());
 }
 @Test @WithMockUser(roles="ADMIN") void committedMutationReachesAnotherSessionWithoutClinicalData() throws Exception {
  MockHttpSession session = new MockHttpSession();
  var stream = mvc.perform(get("/api/events").session(session)).andExpect(status().isOk())
   .andExpect(request().asyncStarted()).andExpect(header().string("X-Accel-Buffering", "no")).andReturn();
  assertTrue(stream.getResponse().getContentAsString().contains("event:sync"));
  mvc.perform(post("/api/departments").with(csrf()).contentType(MediaType.APPLICATION_JSON)
    .content("{\"name\":\"Private Department Label\",\"status\":\"ACTIVE\"}"))
    .andExpect(status().isCreated());
  events.flush();
  String body = stream.getResponse().getContentAsString();
  assertTrue(body.contains("event:changed")); assertTrue(body.contains("departments"));
  assertFalse(body.contains("Private Department Label"));
  session.invalidate(); events.changed(java.util.Set.of("patients")); events.flush();
  assertDoesNotThrow(() -> stream.getAsyncResult(1000));
 }
 @Test void failedWritesAndReadsDoNotPublish() {
  ClinicEvents publisher = mock(ClinicEvents.class);
  var interceptor = new ClinicChangeInterceptor(publisher);
  var request = new MockHttpServletRequest("POST", "/api/patients");
  var response = new MockHttpServletResponse(); response.setStatus(400);
  interceptor.afterCompletion(request, response, this, null);
  response.setStatus(200); interceptor.afterCompletion(request, response, this, new RuntimeException("rollback"));
  request.setMethod("GET"); interceptor.afterCompletion(request, response, this, null);
  verifyNoInteractions(publisher);
  request.setMethod("POST"); interceptor.afterCompletion(request, response, this, null);
  verify(publisher).changed(argThat(topics -> topics.contains("patients") && topics.contains("reports")));
  assertTrue(ClinicChangeInterceptor.resourcesFor("/api/staff-claims/claim").contains("staff"));
  assertTrue(ClinicChangeInterceptor.resourcesFor("/api/bakong/check-md5").isEmpty());
 }
}
