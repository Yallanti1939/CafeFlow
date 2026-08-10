package com.cafeflow.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private String name;
    private String description;
    private String imageUrl;
    private BigDecimal price;
    private Boolean isActive;
    private Boolean isVisible;
    private String availabilityStatus; // AVAILABLE, OUT_OF_STOCK, UNAVAILABLE
    private List<CustomizationGroupDto> customizationGroups;
}
