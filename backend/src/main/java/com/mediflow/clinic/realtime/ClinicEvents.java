package com.mediflow.clinic.realtime;

import java.io.IOException;
import java.util.Set;
import java.util.Map;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import jakarta.annotation.PreDestroy;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/** Single-instance invalidation stream. Contains resource names only, never clinical data. */
@Service
public class ClinicEvents {
    private final Map<SseEmitter, HttpSession> clients = new ConcurrentHashMap<>();
    private final Set<String> pending = ConcurrentHashMap.newKeySet();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread thread = new Thread(r, "clinic-events"); thread.setDaemon(true); return thread;
    });
    private int ticks;
    public ClinicEvents() { scheduler.scheduleWithFixedDelay(this::flush, 500, 500, TimeUnit.MILLISECONDS); }

    public synchronized SseEmitter subscribe(HttpSession session) throws IOException {
        if (clients.size() >= 256) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE);
        SseEmitter emitter = new SseEmitter(300_000L);
        clients.put(emitter, session);
        emitter.onCompletion(() -> clients.remove(emitter));
        emitter.onTimeout(() -> { clients.remove(emitter); emitter.complete(); });
        emitter.onError(error -> clients.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("sync").reconnectTime(3000).data(List.of("*")));
        } catch (IOException | IllegalStateException error) {
            clients.remove(emitter); throw error;
        }
        return emitter;
    }

    public void changed(Set<String> resources) { pending.addAll(resources); }

    void flush() {
        Set<String> batch = new java.util.HashSet<>();
        for (String resource : pending) if (pending.remove(resource)) batch.add(resource);
        boolean heartbeat = ++ticks % 30 == 0;
        if (batch.isEmpty() && !heartbeat) return;
        clients.forEach((emitter, session) -> {
            try {
                session.getCreationTime(); // Throws after logout/session invalidation.
                if (!batch.isEmpty()) emitter.send(SseEmitter.event().name("changed").data(batch));
                else emitter.send(SseEmitter.event().comment("heartbeat"));
            } catch (IOException | IllegalStateException error) {
                clients.remove(emitter);
                emitter.complete();
            }
        });
    }

    @PreDestroy public void close() {
        scheduler.shutdownNow(); clients.keySet().forEach(SseEmitter::complete); clients.clear();
    }
}
