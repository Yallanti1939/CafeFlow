package com.cafeflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CustomerOtpRequest {
    @NotBlank(message = "Mobile number is required.")
    @Pattern(regexp = "\\+?\\d{10,15}", message = "Please provide a valid mobile number.")
    private String mobileNumber;
}
