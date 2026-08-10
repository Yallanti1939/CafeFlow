package com.cafeflow.controller;

import com.cafeflow.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER')")
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardKPIs() {
        return ResponseEntity.ok(analyticsService.getDashboardKPIs());
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAdvancedAnalytics() {
        return ResponseEntity.ok(analyticsService.getAdvancedAnalytics());
    }
}
