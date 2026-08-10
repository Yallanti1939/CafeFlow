package com.cafeflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cart_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    @JsonIgnore
    private Cart cart;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "customization_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal customizationPrice;

    @Column(name = "final_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal finalPrice;

    @Column(name = "selected_customizations", columnDefinition = "TEXT")
    private String selectedCustomizations; // JSON representation of customization options

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (quantity == null) quantity = 1;
        if (customizationPrice == null) customizationPrice = BigDecimal.ZERO;
        if (finalPrice == null) finalPrice = basePrice.add(customizationPrice).multiply(new BigDecimal(quantity));
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        finalPrice = basePrice.add(customizationPrice).multiply(new BigDecimal(quantity));
    }
}
