package com.cafeflow.repository;

import com.cafeflow.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    Optional<Order> findByOrderIdFormatted(String orderIdFormatted);
    List<Order> findAllByOrderByCreatedAtDesc();
}
