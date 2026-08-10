package com.cafeflow.repository;

import com.cafeflow.entity.Product;
import com.cafeflow.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    List<Product> findByDeletedFalse();
    
    Optional<Product> findByIdAndDeletedFalse(Long id);
    
    List<Product> findByCategoryAndDeletedFalse(Category category);
    
    // Customer APIs
    List<Product> findByDeletedFalseAndIsActiveTrueAndIsVisibleTrue();
    
    List<Product> findByCategoryAndDeletedFalseAndIsActiveTrueAndIsVisibleTrue(Category category);
    
    @Query("SELECT p FROM Product p WHERE p.deleted = false AND p.isActive = true AND p.isVisible = true " +
           "AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Product> searchProductsForCustomer(@Param("keyword") String keyword);
    
    @Query("SELECT p FROM Product p WHERE p.deleted = false " +
           "AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Product> searchProductsForAdmin(@Param("keyword") String keyword);
}
