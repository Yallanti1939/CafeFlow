package com.cafeflow.service;

import com.cafeflow.dto.PaymentDto;
import com.cafeflow.dto.PaymentRequest;
import com.cafeflow.entity.*;
import com.cafeflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final AuditLogRepository auditLogRepository;
    private final AdminRepository adminRepository;
    private final PaymentProvider paymentProvider;
    private final WebSocketService webSocketService;
    private final NotificationService notificationService;
    
    // Inject InvoiceService lazily to avoid circular dependency
    @Lazy
    private final InvoiceService invoiceService;

    @Transactional
    public PaymentDto initiatePayment(Long customerId, PaymentRequest request) {
        Order order = orderRepository.findByOrderIdFormatted(request.getOrderIdFormatted())
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + request.getOrderIdFormatted()));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new IllegalStateException("Unauthorized access to this order payment.");
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Order is already paid.");
        }

        // Check if there is an existing PENDING payment session, we can reuse or create a new attempt
        // Create new attempt
        Map<String, Object> session = paymentProvider.initiatePayment(order, request.getPaymentMethod(), request.getAmount());

        Payment payment = Payment.builder()
                .order(order)
                .paymentMethod(PaymentMethod.valueOf(request.getPaymentMethod()))
                .paymentStatus(PaymentStatus.PENDING)
                .amount(request.getAmount())
                .provider("MOCK")
                .providerPaymentId((String) session.get("providerOrderId"))
                .build();

        Payment saved = paymentRepository.save(payment);
        return mapToDto(saved);
    }

    @Transactional
    public PaymentDto verifyPayment(Long customerId, Map<String, String> verificationParams) {
        String orderIdFormatted = verificationParams.get("orderIdFormatted");
        String providerOrderId = verificationParams.get("providerOrderId");
        String providerPaymentId = verificationParams.get("providerPaymentId");
        String signature = verificationParams.get("signature");

        Order order = orderRepository.findByOrderIdFormatted(orderIdFormatted)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderIdFormatted));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new IllegalStateException("Unauthorized access to this order payment verification.");
        }

        Payment payment = paymentRepository.findByOrderIdOrderByCreatedAtDesc(order.getId()).stream()
                .filter(p -> p.getProviderPaymentId().equals(providerOrderId) && p.getPaymentStatus() == PaymentStatus.PENDING)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Active payment session not found for this provider order reference."));

        boolean isVerified = paymentProvider.verifySignature(verificationParams, "secret");

        if (isVerified) {
            payment.setPaymentStatus(PaymentStatus.PAID);
            payment.setProviderPaymentId(providerPaymentId);
            payment.setTransactionReference(providerPaymentId);
            payment.setVerifiedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            order.setPaymentStatus(PaymentStatus.PAID);
            if (order.getStatus() == OrderStatus.PLACED) {
                order.setStatus(OrderStatus.CONFIRMED);
            }
            orderRepository.save(order);

            // Generate Invoice
            invoiceService.generateInvoice(order.getId());

            // Notify Customer & Broadcast WS
            PaymentDto dto = mapToDto(payment);
            webSocketService.broadcastPaymentUpdate(dto);
            notificationService.sendWhatsAppNotification(order, "PAYMENT_CONFIRMED");

            return dto;
        } else {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Webhook signature verification failed.");
            paymentRepository.save(payment);

            order.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(order);

            return mapToDto(payment);
        }
    }

    @Transactional
    public PaymentDto confirmCounterPayment(Long paymentId, Long adminId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found"));

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Payment has already been confirmed as PAID.");
        }

        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin resolver failed."));

        Order order = payment.getOrder();
        String oldStatus = payment.getPaymentStatus().name();

        // Update Payment to PAID
        payment.setPaymentStatus(PaymentStatus.PAID);
        payment.setVerifiedAt(LocalDateTime.now());
        payment.setTransactionReference("COUNTER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        Payment savedPayment = paymentRepository.save(payment);

        // Update Order Payment Status
        order.setPaymentStatus(PaymentStatus.PAID);
        if (order.getStatus() == OrderStatus.PLACED) {
            order.setStatus(OrderStatus.CONFIRMED);
        }
        orderRepository.save(order);

        // Generate Invoice
        invoiceService.generateInvoice(order.getId());

        // Create Audit Log
        AuditLog audit = AuditLog.builder()
                .admin(admin)
                .action("Counter payment confirmed")
                .entityType("PAYMENT")
                .entityId(paymentId)
                .previousValue(oldStatus)
                .newValue("PAID")
                .build();
        auditLogRepository.save(audit);

        // Broadcast WS & Send WhatsApp Message
        PaymentDto dto = mapToDto(savedPayment);
        webSocketService.broadcastPaymentUpdate(dto);
        notificationService.sendWhatsAppNotification(order, "PAYMENT_CONFIRMED");

        return dto;
    }

    public List<PaymentDto> getAllPaymentsForAdmin() {
        return paymentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<PaymentDto> getPaymentsForOrder(Long orderId) {
        return paymentRepository.findByOrderIdOrderByCreatedAtDesc(orderId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public PaymentDto mapToDto(Payment entity) {
        return PaymentDto.builder()
                .id(entity.getId())
                .orderId(entity.getOrder().getId())
                .orderIdFormatted(entity.getOrder().getOrderIdFormatted())
                .paymentMethod(entity.getPaymentMethod().name())
                .paymentStatus(entity.getPaymentStatus().name())
                .amount(entity.getAmount())
                .provider(entity.getProvider())
                .providerPaymentId(entity.getProviderPaymentId())
                .transactionReference(entity.getTransactionReference())
                .failureReason(entity.getFailureReason())
                .verifiedAt(entity.getVerifiedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
