package com.cafeflow.service;

import com.cafeflow.dto.FeedbackRequest;
import com.cafeflow.dto.ProductFeedbackRequest;
import com.cafeflow.entity.*;
import com.cafeflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final OrderRepository orderRepository;
    private final OrderFeedbackRepository orderFeedbackRepository;
    private final ProductFeedbackRepository productFeedbackRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    @Transactional
    public void submitFeedback(Long customerId, FeedbackRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + request.getOrderId()));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new IllegalStateException("You can only submit feedback for your own orders.");
        }

        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new IllegalStateException("Feedback can only be submitted for completed orders.");
        }

        // Check if overall feedback is already submitted
        Optional<OrderFeedback> existingOpt = orderFeedbackRepository.findByOrderId(order.getId());
        if (existingOpt.isPresent()) {
            throw new IllegalStateException("Feedback has already been submitted for this order.");
        }

        // Save overall feedback
        OrderFeedback overall = OrderFeedback.builder()
                .order(order)
                .customer(order.getCustomer())
                .overallRating(request.getOverallRating())
                .serviceRating(request.getServiceRating())
                .comment(request.getComment())
                .recommend(request.getRecommend() != null ? request.getRecommend() : true)
                .build();
        orderFeedbackRepository.save(overall);

        // Save product feedbacks
        if (request.getProductFeedbacks() != null) {
            for (ProductFeedbackRequest pfRequest : request.getProductFeedbacks()) {
                // Verify item was actually in the order
                OrderItem matchedItem = order.getItems().stream()
                        .filter(item -> item.getId().equals(pfRequest.getOrderItemId()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Order item does not belong to this order."));

                // Verify product match
                if (matchedItem.getProduct() != null && !matchedItem.getProduct().getId().equals(pfRequest.getProductId())) {
                    throw new IllegalArgumentException("Product ID mismatch for ordered item.");
                }

                // Verify duplicate feedback prevention
                Optional<ProductFeedback> existingPfOpt = productFeedbackRepository.findByOrderItemId(pfRequest.getOrderItemId());
                if (existingPfOpt.isPresent()) {
                    continue; // Skip if already reviewed
                }

                Product product = matchedItem.getProduct();
                ProductFeedback productFeedback = ProductFeedback.builder()
                        .order(order)
                        .orderItem(matchedItem)
                        .customer(order.getCustomer())
                        .product(product)
                        .rating(pfRequest.getRating())
                        .comment(pfRequest.getComment())
                        .build();
                productFeedbackRepository.save(productFeedback);
            }
        }
    }

    public List<Map<String, Object>> getProductFeedbackList(Long productId) {
        List<ProductFeedback> list = productFeedbackRepository.findByProductIdOrderByCreatedAtDesc(productId);
        List<Map<String, Object>> dtos = new ArrayList<>();
        for (ProductFeedback pf : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", pf.getId());
            map.put("rating", pf.getRating());
            map.put("comment", pf.getComment());
            map.put("createdAt", pf.getCreatedAt());
            String mobile = pf.getCustomer().getMobileNumber();
            map.put("customer", mobile.substring(0, Math.min(4, mobile.length())) + "****");
            dtos.add(map);
        }
        return dtos;
    }

    public Map<String, Object> getOverallFeedbackAnalytics() {
        List<OrderFeedback> list = orderFeedbackRepository.findAll();
        long total = list.size();
        if (total == 0) {
            Map<String, Object> map = new HashMap<>();
            map.put("totalFeedback", 0);
            map.put("avgOverallRating", 0.0);
            map.put("avgServiceRating", 0.0);
            map.put("recommendationRate", 0.0);
            return map;
        }

        double sumOverall = 0;
        double sumService = 0;
        long recommendYes = 0;

        for (OrderFeedback f : list) {
            sumOverall += f.getOverallRating();
            sumService += f.getServiceRating();
            if (f.getRecommend()) {
                recommendYes++;
            }
        }

        Map<String, Object> map = new HashMap<>();
        map.put("totalFeedback", total);
        map.put("avgOverallRating", Math.round((sumOverall / total) * 10.0) / 10.0);
        map.put("avgServiceRating", Math.round((sumService / total) * 10.0) / 10.0);
        map.put("recommendationRate", Math.round(((double) recommendYes / total * 100.0) * 10.0) / 10.0);
        return map;
    }
}
