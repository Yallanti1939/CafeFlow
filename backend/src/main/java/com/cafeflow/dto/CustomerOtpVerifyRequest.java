package com.cafeflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CustomerOtpVerifyRequest {
    @NotBlank(message = "Mobile number is required.")
    @Pattern(regexp = "\\+?\\d{10,15}", message = "Please provide a valid mobile number.")
    private String mobileNumber;

    @NotBlank(message = "OTP code is required.")
    @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits.")
    private String otp;
}
