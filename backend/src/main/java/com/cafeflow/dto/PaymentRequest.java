package com.cafeflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaymentRequest {
    @NotBlank(message = "Order ID formatted is required.")
    private String orderIdFormatted;
    
    @NotBlank(message = "Payment method is required.")
    private String paymentMethod; // UPI, CARD
    
    @NotNull(message = "Amount is required.")
    private BigDecimal amount;
    
    private String providerPaymentId;
    private String transactionReference;
}
