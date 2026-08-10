package com.cafeflow.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDto {
    private Long id;
    private Long orderId;
    private String orderIdFormatted;
    private String paymentMethod;
    private String paymentStatus;
    private BigDecimal amount;
    private String provider;
    private String providerPaymentId;
    private String transactionReference;
    private String failureReason;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
}
