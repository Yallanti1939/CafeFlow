package com.cafeflow.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemCustomizationDto {
    private Long id;
    private String customizationGroupName;
    private String customizationOptionName;
    private BigDecimal additionalPrice;
}
