package com.cafeflow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class MockOtpProvider implements OtpProvider {
    @Override
    public void sendOtp(String mobileNumber, String otp) {
        log.info("[MOCK OTP] Verification code for {} is: {}", mobileNumber, otp);
        System.out.println("==================================================");
        System.out.println("  [MOCK OTP] Code sent to " + mobileNumber + ": " + otp);
        System.out.println("==================================================");
    }
}
