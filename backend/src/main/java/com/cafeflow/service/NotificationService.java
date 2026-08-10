package com.cafeflow.service;

import com.cafeflow.entity.Order;
import com.cafeflow.entity.Notification;
import com.cafeflow.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationProvider notificationProvider;

    @Transactional
    public void sendWhatsAppNotification(Order order, String type) {
        String message = formatMessage(order, type);
        String recipient = order.getCustomer().getMobileNumber();

        // Register pending record
        Notification dbNotification = Notification.builder()
                .customer(order.getCustomer())
                .order(order)
                .type(type)
                .channel("WHATSAPP")
                .status("PENDING")
                .message(message)
                .build();
        dbNotification = notificationRepository.save(dbNotification);

        try {
            String ref = notificationProvider.sendWhatsApp(recipient, message);
            dbNotification.setStatus("SENT");
            dbNotification.setProviderReference(ref);
            dbNotification.setSentAt(LocalDateTime.now());
            notificationRepository.save(dbNotification);
        } catch (Exception e) {
            log.error("Failed to send WhatsApp notification", e);
            dbNotification.setStatus("FAILED");
            notificationRepository.save(dbNotification);
        }
    }

    private String formatMessage(Order order, String type) {
        String idStr = order.getOrderIdFormatted();
        BigDecimal amount = order.getFinalAmount();

        return switch (type) {
            case "COUNTER_PAYMENT_PENDING" ->
                "☕ CafeFlow: Thank you! Your order " + idStr + " has been placed. Please complete your payment of ₹" + amount + " at the counter to start preparation.";
            case "ORDER_CONFIRMED" ->
                "☕ CafeFlow: Great news! Your order " + idStr + " is confirmed and is now being prepared. Total: ₹" + amount;
            case "ORDER_STATUS_UPDATED" ->
                "☕ CafeFlow: Update on your order " + idStr + "! It is now in status: " + order.getStatus().name() + ".";
            case "PAYMENT_CONFIRMED" ->
                "☕ CafeFlow: Payment received successfully for order " + idStr + "! Your invoice is ready. View/Download: http://localhost:5173/invoice/" + idStr;
            case "FEEDBACK_REQUEST" ->
                "☕ CafeFlow: Hope you enjoyed your visit! We value your feedback. Please share your rating and review here: http://localhost:5173/feedback/" + idStr;
            default ->
                "☕ CafeFlow: Update for your order " + idStr + ". Amount: ₹" + amount + ". Status: " + order.getStatus().name();
        };
    }
}
