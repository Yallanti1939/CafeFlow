package com.cafeflow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Slf4j
@Service
public class MockWhatsAppNotificationProvider implements NotificationProvider {
    @Override
    public String sendWhatsApp(String mobileNumber, String message) {
        String refId = "wa_ref_" + UUID.randomUUID().toString().substring(0, 8);
        log.info("[MOCK WHATSAPP] Sending to {}: {}", mobileNumber, message);
        System.out.println("==================================================");
        System.out.println("  [MOCK WHATSAPP NOTIFICATION]");
        System.out.println("  Recipient: " + mobileNumber);
        System.out.println("  Message: " + message);
        System.out.println("  Provider Ref: " + refId);
        System.out.println("==================================================");
        return refId;
    }
}
