package com.cafeflow.repository;

import com.cafeflow.entity.ProductFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductFeedbackRepository extends JpaRepository<ProductFeedback, Long> {
    List<ProductFeedback> findByOrderId(Long orderId);
    Optional<ProductFeedback> findByOrderItemId(Long orderItemId);
    List<ProductFeedback> findByProductIdOrderByCreatedAtDesc(Long productId);
}
