package com.cafeflow.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDto {
    private Long id; // Null for guest cart items
    private Long productId;
    private String productName;
    private String productImageUrl;
    private Integer quantity;
    private BigDecimal basePrice;
    private BigDecimal customizationPrice;
    private BigDecimal finalPrice;
    private List<SelectedCustomizationOptionDto> selectedCustomizations;
}
