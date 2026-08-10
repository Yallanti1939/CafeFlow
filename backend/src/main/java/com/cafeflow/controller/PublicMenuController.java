package com.cafeflow.controller;

import com.cafeflow.dto.CategoryDto;
import com.cafeflow.dto.ProductDto;
import com.cafeflow.service.CategoryService;
import com.cafeflow.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PublicMenuController {

    private final CategoryService categoryService;
    private final ProductService productService;

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto>> getCategories() {
        return ResponseEntity.ok(categoryService.getVisibleCategories());
    }

    @GetMapping("/products")
    public ResponseEntity<List<ProductDto>> getProducts() {
        return ResponseEntity.ok(productService.getActiveProductsForCustomer());
    }

    @GetMapping("/categories/{id}/products")
    public ResponseEntity<List<ProductDto>> getProductsByCategory(@PathVariable("id") Long categoryId) {
        return ResponseEntity.ok(productService.getProductsByCategoryForCustomer(categoryId));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable("id") Long id) {
        try {
            return ResponseEntity.ok(productService.getProductByIdForCustomer(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/products/search")
    public ResponseEntity<List<ProductDto>> searchProducts(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(productService.searchProductsForCustomer(keyword));
    }
}
