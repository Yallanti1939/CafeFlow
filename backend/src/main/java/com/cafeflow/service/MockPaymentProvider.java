package com.cafeflow.service;

import com.cafeflow.entity.Order;
import com.cafeflow.entity.Payment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class MockPaymentProvider implements PaymentProvider {

    @Override
    public Map<String, Object> initiatePayment(Order order, String method, BigDecimal amount) {
        log.info("[MOCK PAYMENT] Initiating session for order: {}, method: {}, amount: {}", 
                order.getOrderIdFormatted(), method, amount);
        
        Map<String, Object> response = new HashMap<>();
        response.put("provider", "MOCK");
        response.put("providerOrderId", "mock_order_" + UUID.randomUUID().toString().substring(0, 8));
        response.put("amount", amount);
        response.put("currency", "INR");
        response.put("status", "CREATED");
        
        return response;
    }

    @Override
    public boolean verifySignature(Map<String, String> params, String secret) {
        // In local development mock mode, we accept signature verification as valid if providerOrderId is present.
        String orderId = params.get("providerOrderId");
        String paymentId = params.get("providerPaymentId");
        
        log.info("[MOCK PAYMENT] Verifying webhook signature. Order: {}, Payment: {}", orderId, paymentId);
        
        // Return true if both IDs are supplied, faking a valid signature
        return orderId != null && !orderId.trim().isEmpty() && paymentId != null && !paymentId.trim().isEmpty();
    }
}
