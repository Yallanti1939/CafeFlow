package com.cafeflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(nullable = false, length = 50)
    private String type; // ORDER_CONFIRMED, PAYMENT_CONFIRMED, etc.

    @Column(nullable = false, length = 50)
    private String channel; // WHATSAPP, SMS, EMAIL

    @Column(nullable = false, length = 50)
    private String status; // PENDING, SENT, FAILED

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "provider_reference")
    private String providerReference;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
