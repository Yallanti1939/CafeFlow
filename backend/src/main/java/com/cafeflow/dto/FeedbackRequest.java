package com.cafeflow.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class FeedbackRequest {
    @NotNull(message = "Order ID is required.")
    private Long orderId;

    @Min(value = 1, message = "Overall rating must be at least 1 star.")
    @Max(value = 5, message = "Overall rating cannot exceed 5 stars.")
    private Integer overallRating;

    @Min(value = 1, message = "Service rating must be at least 1 star.")
    @Max(value = 5, message = "Service rating cannot exceed 5 stars.")
    private Integer serviceRating;

    private String comment;
    
    private Boolean recommend;

    @Valid
    private List<ProductFeedbackRequest> productFeedbacks;
}
