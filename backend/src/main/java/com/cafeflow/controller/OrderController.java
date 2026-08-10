package com.cafeflow.controller;

import com.cafeflow.dto.*;
import com.cafeflow.entity.OrderStatus;
import com.cafeflow.security.AdminPrincipal;
import com.cafeflow.security.CustomerPrincipal;
import com.cafeflow.service.OrderService;
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
public class OrderController {

    private final OrderService orderService;
    private final IdempotencyService idempotencyService;

    @PostMapping("/orders")
    public ResponseEntity<?> placeOrder(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody OrderRequest request) {
        
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            try {
                boolean isDuplicate = idempotencyService.checkAndRegisterKey(idempotencyKey, request);
                if (isDuplicate) {
                    OrderDto cached = idempotencyService.getResponse(idempotencyKey, OrderDto.class);
                    return ResponseEntity.ok(cached);
                }
            } catch (IllegalStateException e) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
            }
        }

        try {
            OrderDto orderDto = orderService.createOrder(principal.getId(), request);
            
            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                idempotencyService.saveResponse(idempotencyKey, orderDto);
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(orderDto);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/customer/orders")
    public ResponseEntity<List<OrderDto>> getCustomerOrders(@AuthenticationPrincipal CustomerPrincipal principal) {
        return ResponseEntity.ok(orderService.getCustomerOrderHistory(principal.getId()));
    }

    @GetMapping("/customer/orders/{orderIdFormatted}")
    public ResponseEntity<OrderDto> getCustomerOrderDetails(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @PathVariable("orderIdFormatted") String orderIdFormatted) {
        try {
            OrderDto order = orderService.getOrderByIdFormatted(orderIdFormatted);
            if (!order.getCustomerId().equals(principal.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/orders/track")
    public ResponseEntity<?> trackOrderPublicly(@RequestBody Map<String, String> body) {
        String orderIdFormatted = body.get("orderId");
        String mobileNumber = body.get("mobileNumber");

        if (orderIdFormatted == null || mobileNumber == null) {
            return ResponseEntity.badRequest().body("Both orderId and mobileNumber are required.");
        }

        try {
            OrderDto order = orderService.getOrderByIdFormatted(orderIdFormatted);
            if (!order.getCustomerMobile().equals(mobileNumber)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Mobile number mismatch.");
            }
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found.");
        }
    }

    @GetMapping("/orders/{orderIdFormatted}/history")
    public ResponseEntity<?> getOrderStatusHistory(
            @AuthenticationPrincipal Object principal, // can be customer or admin
            @PathVariable("orderIdFormatted") String orderIdFormatted) {
        try {
            OrderDto order = orderService.getOrderByIdFormatted(orderIdFormatted);
            
            // Check authorizations
            if (principal instanceof CustomerPrincipal) {
                if (!order.getCustomerId().equals(((CustomerPrincipal) principal).getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            } else if (!(principal instanceof AdminPrincipal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            return ResponseEntity.ok(orderService.getOrderStatusHistory(orderIdFormatted));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // Admin APIs
    @GetMapping("/admin/orders")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<List<OrderDto>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrdersForAdmin());
    }

    @PatchMapping("/admin/orders/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<OrderDto> updateOrderStatus(
            @AuthenticationPrincipal AdminPrincipal adminPrincipal,
            @PathVariable("id") Long orderId,
            @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        String notes = body.get("notes");
        OrderStatus status = OrderStatus.valueOf(statusStr);

        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, status, adminPrincipal.getId(), notes));
    }

    @PatchMapping("/admin/orders/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<OrderDto> cancelOrderAdmin(
            @AuthenticationPrincipal AdminPrincipal adminPrincipal,
            @PathVariable("id") Long orderId,
            @RequestBody Map<String, String> body) {
        String notes = body.get("notes");
        return ResponseEntity.ok(orderService.cancelOrder(orderId, notes, true, adminPrincipal.getId()));
    }
}
