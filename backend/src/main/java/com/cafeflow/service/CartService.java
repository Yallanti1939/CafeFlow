package com.cafeflow.service;

import com.cafeflow.dto.CartDto;
import com.cafeflow.dto.CartItemDto;
import com.cafeflow.dto.SelectedCustomizationOptionDto;
import com.cafeflow.entity.*;
import com.cafeflow.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Cart getOrCreateCart(Long customerId) {
        return cartRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    Customer customer = customerRepository.findById(customerId)
                            .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
                    Cart cart = Cart.builder()
                            .customer(customer)
                            .items(new ArrayList<>())
                            .build();
                    return cartRepository.save(cart);
                });
    }

    public CartDto getCartDtoForCustomer(Long customerId) {
        Cart cart = getOrCreateCart(customerId);
        return mapToDto(cart);
    }

    @Transactional
    public CartDto addCartItem(Long customerId, CartItemDto itemDto) {
        Cart cart = getOrCreateCart(customerId);
        Product product = productRepository.findByIdAndDeletedFalse(itemDto.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (!product.getIsActive() || !product.getIsVisible()) {
            throw new IllegalArgumentException("Product is currently unavailable.");
        }
        if (product.getAvailabilityStatus() == AvailabilityStatus.OUT_OF_STOCK) {
            throw new IllegalArgumentException("Product is out of stock.");
        }
        if (product.getAvailabilityStatus() == AvailabilityStatus.UNAVAILABLE) {
            throw new IllegalArgumentException("Product is unavailable.");
        }

        // Standardize customization lists for duplicate comparisons
        String customJson = serializeCustomizations(itemDto.getSelectedCustomizations());

        // Check duplicates
        CartItem existingItem = null;
        for (CartItem item : cart.getItems()) {
            if (item.getProduct().getId().equals(product.getId()) &&
                Objects.equals(normalizeJson(item.getSelectedCustomizations()), normalizeJson(customJson))) {
                existingItem = item;
                break;
            }
        }

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + itemDto.getQuantity());
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(itemDto.getQuantity())
                    .basePrice(product.getPrice())
                    .customizationPrice(calculateCustomizationsTotal(itemDto.getSelectedCustomizations()))
                    .selectedCustomizations(customJson)
                    .build();
            cartItemRepository.save(newItem);
        }

        // Reload cart
        return getCartDtoForCustomer(customerId);
    }

    @Transactional
    public CartDto updateCartItemQuantity(Long customerId, Long cartItemId, int quantity) {
        Cart cart = getOrCreateCart(customerId);
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Cart item does not belong to the customer's cart");
        }

        if (quantity <= 0) {
            cartItemRepository.delete(cartItem);
        } else {
            cartItem.setQuantity(quantity);
            cartItemRepository.save(cartItem);
        }

        return getCartDtoForCustomer(customerId);
    }

    @Transactional
    public CartDto deleteCartItem(Long customerId, Long cartItemId) {
        return updateCartItemQuantity(customerId, cartItemId, 0);
    }

    @Transactional
    public CartDto mergeCart(Long customerId, List<CartItemDto> guestItems) {
        if (guestItems == null || guestItems.isEmpty()) {
            return getCartDtoForCustomer(customerId);
        }

        for (CartItemDto guestItem : guestItems) {
            try {
                addCartItem(customerId, guestItem);
            } catch (Exception e) {
                log.warn("Failed to merge guest cart item: {}. Error: {}", guestItem.getProductName(), e.getMessage());
            }
        }

        return getCartDtoForCustomer(customerId);
    }

    @Transactional
    public void clearCart(Long customerId) {
        Cart cart = getOrCreateCart(customerId);
        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private BigDecimal calculateCustomizationsTotal(List<SelectedCustomizationOptionDto> list) {
        if (list == null) return BigDecimal.ZERO;
        return list.stream()
                .map(o -> o.getPrice() != null ? o.getPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String serializeCustomizations(List<SelectedCustomizationOptionDto> list) {
        if (list == null) return "[]";
        try {
            // Sort by group name and option name for consistency
            List<SelectedCustomizationOptionDto> sorted = list.stream()
                    .sorted(Comparator.comparing(SelectedCustomizationOptionDto::getGroupName)
                            .thenComparing(SelectedCustomizationOptionDto::getOptionName))
                    .collect(Collectors.toList());
            return objectMapper.writeValueAsString(sorted);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize customizations", e);
            return "[]";
        }
    }

    private List<SelectedCustomizationOptionDto> deserializeCustomizations(String json) {
        if (json == null || json.trim().isEmpty() || json.equals("[]")) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<SelectedCustomizationOptionDto>>() {});
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize customizations: {}", json, e);
            return Collections.emptyList();
        }
    }

    private String normalizeJson(String json) {
        if (json == null) return "[]";
        // Simple normalization
        return json.trim().replaceAll("\\s+", "");
    }

    private CartDto mapToDto(Cart entity) {
        List<CartItemDto> items = entity.getItems() == null ? Collections.emptyList() :
                entity.getItems().stream()
                        .map(item -> CartItemDto.builder()
                                .id(item.getId())
                                .productId(item.getProduct().getId())
                                .productName(item.getProduct().getName())
                                .productImageUrl(item.getProduct().getImageUrl())
                                .quantity(item.getQuantity())
                                .basePrice(item.getBasePrice())
                                .customizationPrice(item.getCustomizationPrice())
                                .finalPrice(item.getFinalPrice())
                                .selectedCustomizations(deserializeCustomizations(item.getSelectedCustomizations()))
                                .build())
                        .collect(Collectors.toList());

        BigDecimal subtotal = items.stream()
                .map(CartItemDto::getFinalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tax calculation: 5% standard GST
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalAmount = subtotal.add(tax).setScale(2, RoundingMode.HALF_UP);

        return CartDto.builder()
                .id(entity.getId())
                .customerId(entity.getCustomer().getId())
                .items(items)
                .subtotal(subtotal)
                .tax(tax)
                .finalAmount(finalAmount)
                .build();
    }
}
