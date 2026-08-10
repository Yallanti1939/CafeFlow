package com.cafeflow.service;

import com.cafeflow.entity.IdempotencyRecord;
import com.cafeflow.repository.IdempotencyRecordRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final IdempotencyRecordRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean checkAndRegisterKey(String key, Object requestPayload) {
        if (key == null || key.trim().isEmpty()) {
            return false;
        }

        String requestHash = generateHash(requestPayload);
        Optional<IdempotencyRecord> recordOpt = repository.findByIdempotencyKey(key);

        if (recordOpt.isPresent()) {
            IdempotencyRecord record = recordOpt.get();
            if (record.getStatus().equals("PENDING")) {
                throw new IllegalStateException("An identical request is currently in progress. Please retry later.");
            }
            if (record.getStatus().equals("COMPLETED") && record.getRequestHash().equals(requestHash)) {
                return true; // it's a verified duplicate
            } else {
                throw new IllegalArgumentException("Idempotency key match found but request payload does not match original transaction.");
            }
        }

        // Register key as pending
        IdempotencyRecord record = IdempotencyRecord.builder()
                .idempotencyKey(key)
                .requestHash(requestHash)
                .status("PENDING")
                .build();
        repository.save(record);
        return false;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveResponse(String key, Object responsePayload) {
        if (key == null || key.trim().isEmpty()) return;

        repository.findByIdempotencyKey(key).ifPresent(record -> {
            try {
                record.setResponseData(objectMapper.writeValueAsString(responsePayload));
                record.setStatus("COMPLETED");
                repository.save(record);
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize response payload for idempotency key: {}", key, e);
                record.setStatus("FAILED");
                repository.save(record);
            }
        });
    }

    public <T> T getResponse(String key, Class<T> responseType) {
        IdempotencyRecord record = repository.findByIdempotencyKey(key)
                .orElseThrow(() -> new IllegalArgumentException("Idempotency record not found."));
        try {
            return objectMapper.readValue(record.getResponseData(), responseType);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize idempotency response payload", e);
        }
    }

    private String generateHash(Object payload) {
        if (payload == null) return "";
        try {
            String json = objectMapper.writeValueAsString(payload);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(json.getBytes());
            return HexFormat.of().formatHex(hashBytes);
        } catch (JsonProcessingException | NoSuchAlgorithmException e) {
            log.error("Error creating hash for payload", e);
            return "";
        }
    }
}
