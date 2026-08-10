package com.cafeflow.service;

import com.cafeflow.entity.Order;
import com.cafeflow.entity.Payment;
import java.math.BigDecimal;
import java.util.Map;

public interface PaymentProvider {
    Map<String, Object> initiatePayment(Order order, String method, BigDecimal amount);
    boolean verifySignature(Map<String, String> params, String secret);
}
