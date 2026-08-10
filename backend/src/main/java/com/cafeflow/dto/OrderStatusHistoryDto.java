package com.cafeflow.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistoryDto {
    private Long id;
    private Long orderId;
    private String status;
    private String changedByType;
    private String notes;
    private LocalDateTime createdAt;
}
