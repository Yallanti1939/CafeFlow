package com.cafeflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type; // ADMIN or CUSTOMER
    private String role; // Role of admin, or CUSTOMER
    private String identifier; // Email or Mobile number
    private String name; // Display name
}
