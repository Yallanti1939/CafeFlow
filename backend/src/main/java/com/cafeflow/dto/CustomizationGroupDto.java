package com.cafeflow.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomizationGroupDto {
    private Long id;
    private String name;
    private Boolean isRequired;
    private String selectionType; // SINGLE, MULTI
    private List<CustomizationOptionDto> options;
}
