package com.cafeflow.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelectedCustomizationOptionDto {
    private String groupName;
    private String optionName;
    private BigDecimal price;
}
