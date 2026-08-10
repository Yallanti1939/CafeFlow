package com.cafeflow.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProductFeedbackRequest {
    @NotNull(message = "Product ID is required.")
    private Long productId;
    
    @NotNull(message = "Order item ID is required.")
    private Long orderItemId;
    
    @Min(value = 1, message = "Rating must be at least 1 star.")
    @Max(value = 5, message = "Rating cannot exceed 5 stars.")
    private Integer rating;
    
    private String comment;
}
