package com.cafeflow.controller;

import com.cafeflow.dto.CustomerOtpRequest;
import com.cafeflow.dto.CustomerOtpVerifyRequest;
import com.cafeflow.dto.AuthResponse;
import com.cafeflow.entity.Customer;
import com.cafeflow.entity.Cart;
import com.cafeflow.repository.CustomerRepository;
import com.cafeflow.repository.CartRepository;
import com.cafeflow.service.OtpService;
import com.cafeflow.security.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/customer")
@RequiredArgsConstructor
public class CustomerAuthController {

    private final OtpService otpService;
    private final CustomerRepository customerRepository;
    private final CartRepository cartRepository;
    private final JwtUtils jwtUtils;
    private final Environment environment;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody CustomerOtpRequest request) {
        try {
            String otp = otpService.generateAndSendOtp(request.getMobileNumber());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "OTP sent successfully.");
            
            // Return OTP in API response for local testing unless explicitly in production
            boolean isDev = true;
            for (String profile : environment.getActiveProfiles()) {
                if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                    isDev = false;
                    break;
                }
            }
            if (isDev) {
                response.put("otp", otp);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody CustomerOtpVerifyRequest request) {
        try {
            boolean isVerified = otpService.verifyOtp(request.getMobileNumber(), request.getOtp());
            if (!isVerified) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid verification code. Please try again.");
            }

            // Find or create customer
            Customer customer = customerRepository.findByMobileNumber(request.getMobileNumber())
                    .orElse(null);

            boolean isNewCustomer = (customer == null);
            if (isNewCustomer) {
                customer = Customer.builder()
                        .mobileNumber(request.getMobileNumber())
                        .build();
                customer = customerRepository.save(customer);

                // Initialize database cart for new customer
                Cart cart = Cart.builder()
                        .customer(customer)
                        .build();
                cartRepository.save(cart);
            }

            String token = jwtUtils.generateCustomerToken(customer.getMobileNumber());

            AuthResponse response = AuthResponse.builder()
                    .token(token)
                    .type("CUSTOMER")
                    .role("CUSTOMER")
                    .identifier(customer.getMobileNumber())
                    .name("Customer (" + customer.getMobileNumber().substring(Math.max(0, customer.getMobileNumber().length() - 4)) + ")")
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
