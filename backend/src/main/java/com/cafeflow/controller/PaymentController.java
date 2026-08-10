package com.cafeflow.controller;

import com.cafeflow.dto.*;
import com.cafeflow.security.AdminPrincipal;
import com.cafeflow.security.CustomerPrincipal;
import com.cafeflow.service.PaymentService;
import com.cafeflow.service.IdempotencyService;
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
public class PaymentController {

    private final PaymentService paymentService;
    private final IdempotencyService idempotencyService;

    @PostMapping("/payments/initiate")
    public ResponseEntity<?> initiatePayment(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody PaymentRequest request) {

        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            try {
                boolean isDuplicate = idempotencyService.checkAndRegisterKey(idempotencyKey, request);
                if (isDuplicate) {
                    PaymentDto cached = idempotencyService.getResponse(idempotencyKey, PaymentDto.class);
                    return ResponseEntity.ok(cached);
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
            }
        }

        try {
            PaymentDto dto = paymentService.initiatePayment(principal.getId(), request);
            
            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                idempotencyService.saveResponse(idempotencyKey, dto);
            }
            
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/payments/verify")
    public ResponseEntity<?> verifyPayment(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody Map<String, String> params) {

        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            try {
                boolean isDuplicate = idempotencyService.checkAndRegisterKey(idempotencyKey, params);
                if (isDuplicate) {
                    PaymentDto cached = idempotencyService.getResponse(idempotencyKey, PaymentDto.class);
                    return ResponseEntity.ok(cached);
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
            }
        }

        try {
            PaymentDto dto = paymentService.verifyPayment(principal.getId(), params);
            
            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                idempotencyService.saveResponse(idempotencyKey, dto);
            }
            
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/admin/payments/{id}/confirm")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> confirmCounterPayment(
            @AuthenticationPrincipal AdminPrincipal principal,
            @PathVariable("id") Long paymentId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {

        // Confirm Counter pay
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            try {
                // Faking an empty request payload for signature comparison
                boolean isDuplicate = idempotencyService.checkAndRegisterKey(idempotencyKey, "CONFIRM-" + paymentId);
                if (isDuplicate) {
                    PaymentDto cached = idempotencyService.getResponse(idempotencyKey, PaymentDto.class);
                    return ResponseEntity.ok(cached);
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
            }
        }

        try {
            PaymentDto dto = paymentService.confirmCounterPayment(paymentId, principal.getId());
            
            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                idempotencyService.saveResponse(idempotencyKey, dto);
            }
            
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/admin/payments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER')")
    public ResponseEntity<List<PaymentDto>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPaymentsForAdmin());
    }
}
