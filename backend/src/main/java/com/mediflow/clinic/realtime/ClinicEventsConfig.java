package com.mediflow.clinic.realtime;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
@Configuration
public class ClinicEventsConfig implements WebMvcConfigurer {
    private final ClinicChangeInterceptor interceptor;
    public ClinicEventsConfig(ClinicChangeInterceptor interceptor) { this.interceptor = interceptor; }
    @Override public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor).addPathPatterns("/api/**").excludePathPatterns("/api/events");
    }
}
