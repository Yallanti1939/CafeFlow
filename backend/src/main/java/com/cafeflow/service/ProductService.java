package com.cafeflow.service;

import com.cafeflow.dto.CustomizationGroupDto;
import com.cafeflow.dto.CustomizationOptionDto;
import com.cafeflow.dto.ProductDto;
import com.cafeflow.entity.AvailabilityStatus;
import com.cafeflow.entity.Category;
import com.cafeflow.entity.CustomizationGroup;
import com.cafeflow.entity.Product;
import com.cafeflow.repository.CategoryRepository;
import com.cafeflow.repository.CustomizationGroupRepository;
import com.cafeflow.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CustomizationGroupRepository customizationGroupRepository;

    // Admin APIs
    public List<ProductDto> getAllProductsForAdmin() {
        return productRepository.findByDeletedFalse().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ProductDto> searchProductsForAdmin(String keyword) {
        return productRepository.searchProductsForAdmin(keyword).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProductDto getProductByIdForAdmin(Long id) {
        Product product = productRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        return mapToDto(product);
    }

    // Customer APIs
    public List<ProductDto> getActiveProductsForCustomer() {
        return productRepository.findByDeletedFalseAndIsActiveTrueAndIsVisibleTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ProductDto> getProductsByCategoryForCustomer(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + categoryId));
        return productRepository.findByCategoryAndDeletedFalseAndIsActiveTrueAndIsVisibleTrue(category).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ProductDto> searchProductsForCustomer(String keyword) {
        return productRepository.searchProductsForCustomer(keyword).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProductDto getProductByIdForCustomer(Long id) {
        Product product = productRepository.findByIdAndDeletedFalse(id)
                .filter(p -> p.getIsActive() && p.getIsVisible())
                .orElseThrow(() -> new IllegalArgumentException("Product not found or unavailable."));
        return mapToDto(product);
    }

    @Transactional
    public ProductDto createProduct(ProductDto dto) {
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + dto.getCategoryId()));

        Product product = Product.builder()
                .category(category)
                .name(dto.getName())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .price(dto.getPrice())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .isVisible(dto.getIsVisible() != null ? dto.getIsVisible() : true)
                .availabilityStatus(dto.getAvailabilityStatus() != null ? 
                        AvailabilityStatus.valueOf(dto.getAvailabilityStatus()) : AvailabilityStatus.AVAILABLE)
                .deleted(false)
                .build();

        if (dto.getCustomizationGroups() != null) {
            Set<CustomizationGroup> groups = dto.getCustomizationGroups().stream()
                    .map(g -> customizationGroupRepository.findById(g.getId())
                            .orElseThrow(() -> new IllegalArgumentException("Customization group not found: " + g.getId())))
                    .collect(Collectors.toSet());
            product.setCustomizationGroups(groups);
        }

        return mapToDto(productRepository.save(product));
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductDto dto) {
        Product product = productRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + dto.getCategoryId()));

        product.setCategory(category);
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setImageUrl(dto.getImageUrl());
        product.setPrice(dto.getPrice());
        product.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : product.getIsActive());
        product.setIsVisible(dto.getIsVisible() != null ? dto.getIsVisible() : product.getIsVisible());
        product.setAvailabilityStatus(dto.getAvailabilityStatus() != null ? 
                AvailabilityStatus.valueOf(dto.getAvailabilityStatus()) : product.getAvailabilityStatus());

        if (dto.getCustomizationGroups() != null) {
            Set<CustomizationGroup> groups = dto.getCustomizationGroups().stream()
                    .map(g -> customizationGroupRepository.findById(g.getId())
                            .orElseThrow(() -> new IllegalArgumentException("Customization group not found: " + g.getId())))
                    .collect(Collectors.toSet());
            product.setCustomizationGroups(groups);
        }

        return mapToDto(productRepository.save(product));
    }

    @Transactional
    public ProductDto updateAvailability(Long id, String status) {
        Product product = productRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        product.setAvailabilityStatus(AvailabilityStatus.valueOf(status));
        return mapToDto(productRepository.save(product));
    }

    @Transactional
    public ProductDto updateVisibility(Long id, boolean visible) {
        Product product = productRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        product.setIsVisible(visible);
        return mapToDto(productRepository.save(product));
    }

    @Transactional
    public ProductDto updateActive(Long id, boolean active) {
        Product product = productRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        product.setIsActive(active);
        return mapToDto(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        // Soft delete
        product.setDeleted(true);
        productRepository.save(product);
    }

    private ProductDto mapToDto(Product entity) {
        List<CustomizationGroupDto> groups = null;
        if (entity.getCustomizationGroups() != null) {
            groups = entity.getCustomizationGroups().stream()
                    .map(g -> CustomizationGroupDto.builder()
                            .id(g.getId())
                            .name(g.getName())
                            .isRequired(g.getIsRequired())
                            .selectionType(g.getSelectionType().name())
                            .options(g.getOptions() == null ? null : g.getOptions().stream()
                                    .map(o -> CustomizationOptionDto.builder()
                                            .id(o.getId())
                                            .name(o.getName())
                                            .price(o.getPrice())
                                            .isAvailable(o.getIsAvailable())
                                            .build())
                                    .collect(Collectors.toList()))
                            .build())
                    .collect(Collectors.toList());
        }

        return ProductDto.builder()
                .id(entity.getId())
                .categoryId(entity.getCategory().getId())
                .categoryName(entity.getCategory().getName())
                .name(entity.getName())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .price(entity.getPrice())
                .isActive(entity.getIsActive())
                .isVisible(entity.getIsVisible())
                .availabilityStatus(entity.getAvailabilityStatus().name())
                .customizationGroups(groups)
                .build();
    }
}
