package com.cafeflow.controller;

import com.cafeflow.dto.AdminLoginRequest;
import com.cafeflow.dto.AuthResponse;
import com.cafeflow.entity.Admin;
import com.cafeflow.repository.AdminRepository;
import com.cafeflow.security.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping({"/api/admin/auth", "/api/auth/admin"})
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AdminLoginRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword().trim() : "";

        Admin admin = adminRepository.findByEmailIgnoreCase(cleanEmail)
                .orElse(null);

        if (admin == null) {
            log.warn("Admin login failed: No admin found with email '{}'", cleanEmail);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password.");
        }

        if (!passwordEncoder.matches(rawPassword, admin.getPasswordHash())) {
            log.warn("Admin login failed: Password mismatch for email '{}'", cleanEmail);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password.");
        }

        String token = jwtUtils.generateAdminToken(admin.getEmail(), admin.getRole().name());

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .type("ADMIN")
                .role(admin.getRole().name())
                .identifier(admin.getEmail())
                .name(admin.getName())
                .build();

        log.info("Admin successfully logged in: {}", admin.getEmail());
        return ResponseEntity.ok(response);
    }
}
