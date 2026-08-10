package com.cafeflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderRequest {
    @NotBlank(message = "Payment method is required.")
    private String paymentMethod; // UPI, CARD, COUNTER_PAY
    private BigDecimal discount;
}
