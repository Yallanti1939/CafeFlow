package com.cafeflow.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private Integer quantity;
    private BigDecimal unitBasePrice;
    private BigDecimal customizationTotal;
    private BigDecimal unitFinalPrice;
    private BigDecimal totalPrice;
    private List<OrderItemCustomizationDto> customizations;
}
