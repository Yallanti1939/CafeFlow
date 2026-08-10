package com.cafeflow.service;

import com.cafeflow.entity.OtpVerification;
import com.cafeflow.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpVerificationRepository otpVerificationRepository;
    private final OtpProvider otpProvider;

    @Value("${cafeflow.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${cafeflow.otp.resend-cooldown-seconds:30}")
    private int resendCooldownSeconds;

    @Value("${cafeflow.otp.max-attempts:5}")
    private int maxAttempts;

    private final Random random = new Random();

    @Transactional
    public String generateAndSendOtp(String mobileNumber) {
        // Validate mobile format
        if (mobileNumber == null || mobileNumber.trim().isEmpty() || !mobileNumber.matches("\\+?\\d{10,15}")) {
            throw new IllegalArgumentException("Invalid mobile number format.");
        }

        // Check resend cooldown
        Optional<OtpVerification> lastOtpOpt = otpVerificationRepository.findFirstByMobileNumberOrderByCreatedAtDesc(mobileNumber);
        if (lastOtpOpt.isPresent()) {
            OtpVerification lastOtp = lastOtpOpt.get();
            if (lastOtp.getCreatedAt().plusSeconds(resendCooldownSeconds).isAfter(LocalDateTime.now())) {
                throw new IllegalStateException("Please wait " + resendCooldownSeconds + " seconds before requesting another OTP.");
            }
        }

        // Invalidate old OTPs for this number
        otpVerificationRepository.findByMobileNumberAndVerifiedFalse(mobileNumber).forEach(otp -> {
            otp.setExpiresAt(LocalDateTime.now().minusSeconds(1)); // set expired
            otpVerificationRepository.save(otp);
        });

        // Generate 6 digit OTP
        String otp = String.format("%06d", random.nextInt(1000000));
        String hashedOtp = hashSha256(otp);

        // Save new OTP
        OtpVerification verification = OtpVerification.builder()
                .mobileNumber(mobileNumber)
                .hashedOtp(hashedOtp)
                .expiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .verified(false)
                .attempts(0)
                .build();
        otpVerificationRepository.save(verification);

        // Send OTP via provider
        otpProvider.sendOtp(mobileNumber, otp);

        return otp;
    }

    @Transactional
    public boolean verifyOtp(String mobileNumber, String code) {
        if (mobileNumber == null || code == null || code.trim().length() != 6) {
            throw new IllegalArgumentException("Invalid mobile number or 6-digit OTP code.");
        }

        OtpVerification verification = otpVerificationRepository.findFirstByMobileNumberOrderByCreatedAtDesc(mobileNumber)
                .orElseThrow(() -> new IllegalArgumentException("No OTP requested for this mobile number."));

        if (verification.getVerified()) {
            throw new IllegalStateException("OTP already verified.");
        }

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("OTP expired. Please request a new one.");
        }

        if (verification.getAttempts() >= maxAttempts) {
            throw new IllegalStateException("Maximum verification attempts exceeded. Please request a new OTP.");
        }

        // Increment attempts
        verification.setAttempts(verification.getAttempts() + 1);
        otpVerificationRepository.save(verification);

        // Check hash
        String incomingHash = hashSha256(code);
        if (verification.getHashedOtp().equals(incomingHash)) {
            verification.setVerified(true);
            otpVerificationRepository.save(verification);
            return true;
        }

        return false;
    }

    private String hashSha256(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
