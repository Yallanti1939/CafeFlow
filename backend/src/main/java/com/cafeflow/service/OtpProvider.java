package com.cafeflow.service;

public interface OtpProvider {
    void sendOtp(String mobileNumber, String otp);
}
