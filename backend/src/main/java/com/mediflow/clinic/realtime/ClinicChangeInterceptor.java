package com.mediflow.clinic.realtime;

import java.util.Set;
import java.util.HashSet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Runs after successful request completion, after transactional services have committed. */
@Component
public class ClinicChangeInterceptor implements HandlerInterceptor {
    private final ClinicEvents events;
    public ClinicChangeInterceptor(ClinicEvents events) { this.events = events; }
    @Override public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception error) {
        if (error != null || response.getStatus() < 200 || response.getStatus() >= 300
            || !Set.of("POST", "PUT", "PATCH", "DELETE").contains(request.getMethod())) return;
        Set<String> resources = resourcesFor(request.getRequestURI());
        if (!resources.isEmpty()) events.changed(resources);
    }
    static Set<String> resourcesFor(String path) {
        String[] parts = path.split("/");
        if (parts.length < 3 || !parts[1].equals("api")) return Set.of();
        String resource = parts[2];
        if (!Set.of("patients", "staff", "departments", "appointments", "queue", "vitals", "encounters",
            "invoices", "payments", "billing-services", "settings", "access-control").contains(resource)) {
            if (path.equals("/api/auth/register") || path.startsWith("/api/staff-claims/")) return Set.of("staff", "access-control", "audit-logs");
            return Set.of();
        }
        Set<String> resources = new HashSet<>(Set.of(resource, "reports", "audit-logs"));
        if (resource.equals("invoices") || resource.equals("payments")) resources.addAll(Set.of("invoices", "payments"));
        if (resource.equals("appointments") || resource.equals("encounters")) resources.add("queue");
        if (resource.equals("staff") || resource.equals("access-control")) resources.addAll(Set.of("staff", "access-control"));
        if (resource.equals("patients")) resources.addAll(Set.of("appointments", "queue", "vitals", "encounters", "invoices", "payments"));
        if (resource.equals("staff")) resources.addAll(Set.of("appointments", "queue", "vitals", "encounters"));
        if (resource.equals("departments")) resources.add("staff");
        return resources;
    }
}
