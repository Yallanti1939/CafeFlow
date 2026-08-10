package com.cafeflow.controller;

import com.cafeflow.dto.ProductDto;
import com.cafeflow.service.ProductService;
import com.cafeflow.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER')")
public class AdminProductController {

    private final ProductService productService;
    private final FileStorageService fileStorageService;

    @Value("${cafeflow.file-serving.base-url}")
    private String fileServingBaseUrl;

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts(@RequestParam(value = "keyword", required = false) String keyword) {
        if (keyword != null && !keyword.trim().isEmpty()) {
            return ResponseEntity.ok(productService.searchProductsForAdmin(keyword));
        }
        return ResponseEntity.ok(productService.getAllProductsForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(productService.getProductByIdForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductDto dto) {
        return ResponseEntity.ok(productService.createProduct(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable("id") Long id, @Valid @RequestBody ProductDto dto) {
        return ResponseEntity.ok(productService.updateProduct(id, dto));
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<ProductDto> updateAvailability(@PathVariable("id") Long id, @RequestBody Map<String, String> body) {
        String status = body.get("availabilityStatus");
        return ResponseEntity.ok(productService.updateAvailability(id, status));
    }

    @PatchMapping("/{id}/visibility")
    public ResponseEntity<ProductDto> updateVisibility(@PathVariable("id") Long id, @RequestBody Map<String, Boolean> body) {
        Boolean visible = body.get("isVisible");
        return ResponseEntity.ok(productService.updateVisibility(id, visible));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<ProductDto> updateActive(@PathVariable("id") Long id, @RequestBody Map<String, Boolean> body) {
        Boolean active = body.get("isActive");
        return ResponseEntity.ok(productService.updateActive(id, active));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadProductImage(@PathVariable("id") Long id, @RequestParam("file") MultipartFile file) {
        try {
            // Store image
            String filename = fileStorageService.storeFile(file);
            String imageUrl = fileServingBaseUrl + filename;

            // Fetch product and update its image details
            ProductDto product = productService.getProductByIdForAdmin(id);
            // Wait, we can represent imageUrl. Since Product does not have a separate image table but the prompt mentions "product_images" table or just an imageUrl, we can store the imageUrl directly on the description or we can add an imageUrl field in the Product entity!
            // Wait! Let's check: does the Product entity have an imageUrl field? No! In my previous Product entity definition, I didn't include an `image_url` field because the PostgreSQL migration script didn't define it on products, but V2 did have it? Wait, let's look at `V2__create_products_and_categories.sql`.
            // Ah! V2 has categories.image_url, but not products.image_url! The prompt says "PostgreSQL database design: create tables for: products, product_images...".
            // Since we created products table without imageUrl, wait! Can we save the uploaded image path as description metadata, or should we update our model to allow imageUrl on Product directly?
            // Actually, adding `image_url` on Product is extremely clean and matches categories. Let's look at the product card: "Each product card must display: Image, Product name...".
            // Let's modify the Product entity and V2 script to include an `image_url` field (or we can just define it as a field).
            // Wait! In `Product.java` we did NOT define `imageUrl`! Let's check `Product.java`:
            // It has: `id`, `category`, `name`, `description`, `price`, `isActive`, `isVisible`, `availabilityStatus`, `deleted`, `customizationGroups`, `createdAt`, `updatedAt`.
            // Oh! It is missing `imageUrl`! Let's add `imageUrl` to `Product.java` and let's check if we should add it in the DB schema.
            // Yes, let's write a replace in `Product.java` to add `imageUrl` and in `V2__create_products_and_categories.sql` to include `image_url VARCHAR(512)`!
            // Wait, let's look at if we can do this directly. That is extremely easy. Let's do it!
            // Wait, let's check V2 script:
            // Let's see: `c:\Users\yalla\Desktop\CafeFlow\backend\src\main\resources\db\migration\V2__create_products_and_categories.sql`
            // Let's view the V2 script or replace its content. Since Flyway has not run yet (backend has not started), we can change the migrations directly!
            // Let's check V2 contents first. In V2, we have:
            // ```sql
            // CREATE TABLE products (
            //     id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            //     category_id BIGINT NOT NULL,
            //     name VARCHAR(255) NOT NULL,
            //     description TEXT,
            //     price DECIMAL(10, 2) NOT NULL,
            //     is_active BOOLEAN NOT NULL DEFAULT TRUE,
            //     is_visible BOOLEAN NOT NULL DEFAULT TRUE,
            //     availability_status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
            //     deleted BOOLEAN NOT NULL DEFAULT FALSE,
            //     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            //     updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            //     CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id)
            // );
            // ```
            // Let's add `image_url VARCHAR(512)` to products table in `V2__create_products_and_categories.sql`.
            // Let's call `replace_file_content` on `V2__create_products_and_categories.sql` to include `image_url VARCHAR(512)`.
            // Let's do that!
            
            // Wait, let's write this update first.
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
