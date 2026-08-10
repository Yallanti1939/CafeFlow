package com.cafeflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "product_image_url", length = 512)
    private String productImageUrl;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitBasePrice;

    @Column(name = "customization_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal customizationTotal;

    @Column(name = "unit_final_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitFinalPrice;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @OneToMany(mappedBy = "orderItem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItemCustomization> customizations;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (customizationTotal == null) customizationTotal = BigDecimal.ZERO;
        unitFinalPrice = unitBasePrice.add(customizationTotal);
        totalPrice = unitFinalPrice.multiply(new BigDecimal(quantity));
    }
}
