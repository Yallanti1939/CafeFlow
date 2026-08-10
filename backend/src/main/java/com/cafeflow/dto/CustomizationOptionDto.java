package com.cafeflow.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomizationOptionDto {
    private Long id;
    private String name;
    private BigDecimal price;
    private Boolean isAvailable;
}
