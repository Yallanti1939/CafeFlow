package com.cafeflow.controller;

import com.cafeflow.dto.CartDto;
import com.cafeflow.dto.CartItemDto;
import com.cafeflow.security.CustomerPrincipal;
import com.cafeflow.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartDto> getCart(@AuthenticationPrincipal CustomerPrincipal principal) {
        return ResponseEntity.ok(cartService.getCartDtoForCustomer(principal.getId()));
    }

    @PostMapping("/items")
    public ResponseEntity<CartDto> addCartItem(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @RequestBody CartItemDto itemDto) {
        return ResponseEntity.ok(cartService.addCartItem(principal.getId(), itemDto));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<CartDto> updateCartItemQuantity(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @PathVariable("id") Long cartItemId,
            @RequestBody Map<String, Integer> body) {
        int quantity = body.getOrDefault("quantity", 1);
        return ResponseEntity.ok(cartService.updateCartItemQuantity(principal.getId(), cartItemId, quantity));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<CartDto> deleteCartItem(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @PathVariable("id") Long cartItemId) {
        return ResponseEntity.ok(cartService.deleteCartItem(principal.getId(), cartItemId));
    }

    @PostMapping("/merge")
    public ResponseEntity<CartDto> mergeCart(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @RequestBody List<CartItemDto> guestItems) {
        return ResponseEntity.ok(cartService.mergeCart(principal.getId(), guestItems));
    }
}
