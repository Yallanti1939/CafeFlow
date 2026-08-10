package com.cafeflow.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private Long id;
    private String orderIdFormatted;
    private Long customerId;
    private String customerMobile;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal discount;
    private BigDecimal finalAmount;
    private String status; // OrderStatus
    private String paymentMethod; // PaymentMethod
    private String paymentStatus; // PaymentStatus
    private List<OrderItemDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
