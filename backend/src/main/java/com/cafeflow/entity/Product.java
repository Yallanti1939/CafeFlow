package com.cafeflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "is_visible", nullable = false)
    private Boolean isVisible;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", nullable = false, length = 50)
    private AvailabilityStatus availabilityStatus;

    @Column(nullable = false)
    private Boolean deleted; // Soft delete field

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "product_customization_groups",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "group_id")
    )
    private Set<CustomizationGroup> customizationGroups;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
        if (isVisible == null) isVisible = true;
        if (availabilityStatus == null) availabilityStatus = AvailabilityStatus.AVAILABLE;
        if (deleted == null) deleted = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
