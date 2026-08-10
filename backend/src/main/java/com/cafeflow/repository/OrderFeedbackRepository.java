package com.cafeflow.repository;

import com.cafeflow.entity.OrderFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OrderFeedbackRepository extends JpaRepository<OrderFeedback, Long> {
    Optional<OrderFeedback> findByOrderId(Long orderId);
}
