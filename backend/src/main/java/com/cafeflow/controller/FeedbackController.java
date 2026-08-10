package com.cafeflow.controller;

import com.cafeflow.dto.FeedbackRequest;
import com.cafeflow.security.CustomerPrincipal;
import com.cafeflow.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping("/feedback")
    public ResponseEntity<?> submitFeedback(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @Valid @RequestBody FeedbackRequest request) {
        try {
            feedbackService.submitFeedback(principal.getId(), request);
            return ResponseEntity.ok(Map.of("message", "Feedback submitted successfully. Thank you!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/products/{id}/feedback")
    public ResponseEntity<List<Map<String, Object>>> getProductFeedback(@PathVariable("id") Long productId) {
        return ResponseEntity.ok(feedbackService.getProductFeedbackList(productId));
    }

    @GetMapping("/admin/feedback")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getFeedbackAnalytics() {
        return ResponseEntity.ok(feedbackService.getOverallFeedbackAnalytics());
    }
}
