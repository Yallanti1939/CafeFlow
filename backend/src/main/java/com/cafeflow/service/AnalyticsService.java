package com.cafeflow.service;

import com.cafeflow.entity.*;
import com.cafeflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

        private final OrderRepository orderRepository;
        private final PaymentRepository paymentRepository;
        private final OrderFeedbackRepository orderFeedbackRepository;
        private final ProductFeedbackRepository productFeedbackRepository;

        public Map<String, Object> getDashboardKPIs() {
                LocalDate today = LocalDate.now();

                List<Order> allOrders = orderRepository.findAll();
                List<Order> todayOrders = allOrders.stream()
                                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().toLocalDate().equals(today))
                                .collect(Collectors.toList());

                // Today's Revenue from Paid Orders placed today
                BigDecimal todayOrderRevenue = allOrders.stream()
                                .filter(o -> o.getPaymentStatus() == PaymentStatus.PAID &&
                                             o.getCreatedAt() != null && o.getCreatedAt().toLocalDate().equals(today))
                                .map(Order::getFinalAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Today's Revenue from Payments verified/paid today (includes counter pay cash collected today)
                List<Payment> allPayments = paymentRepository.findAll();
                BigDecimal todayPaymentRevenue = allPayments.stream()
                                .filter(p -> p.getPaymentStatus() == PaymentStatus.PAID &&
                                             p.getVerifiedAt() != null && p.getVerifiedAt().toLocalDate().equals(today))
                                .map(Payment::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Max of order revenue or payment verified revenue
                BigDecimal finalTodayRevenue = todayOrderRevenue.max(todayPaymentRevenue);

                // Pending Orders (placed, confirmed, preparing, ready)
                long pendingOrders = allOrders.stream()
                                .filter(o -> o.getStatus() == OrderStatus.PLACED ||
                                                o.getStatus() == OrderStatus.CONFIRMED ||
                                                o.getStatus() == OrderStatus.PREPARING ||
                                                o.getStatus() == OrderStatus.READY)
                                .count();

                // Completed Orders
                long completedOrders = allOrders.stream()
                                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                                .count();

                // Pending Counter Payments
                long pendingCounter = allOrders.stream()
                                .filter(o -> o.getPaymentMethod() == PaymentMethod.COUNTER_PAY
                                                && o.getPaymentStatus() == PaymentStatus.PENDING)
                                .count();

                // Average Customer Rating
                List<OrderFeedback> feedbacks = orderFeedbackRepository.findAll();
                double avgRating = feedbacks.stream()
                                .mapToInt(OrderFeedback::getOverallRating)
                                .average()
                                .orElse(0.0);

                Map<String, Object> kpis = new HashMap<>();
                kpis.put("todayRevenue", finalTodayRevenue);
                kpis.put("todayOrdersCount", todayOrders.size());
                kpis.put("pendingOrdersCount", pendingOrders);
                kpis.put("completedOrdersCount", completedOrders);
                kpis.put("pendingCounterPayments", pendingCounter);
                kpis.put("averageCustomerRating", Math.round(avgRating * 10.0) / 10.0);

                return kpis;
        }

        public Map<String, Object> getAdvancedAnalytics() {
                List<Order> allOrders = orderRepository.findAll();
                List<Payment> allPayments = paymentRepository.findAll();

                // Sales by payment method
                Map<String, Long> paymentMethodCounts = allOrders.stream()
                                .collect(Collectors.groupingBy(o -> o.getPaymentMethod().name(),
                                                Collectors.counting()));

                // Orders by Status
                Map<String, Long> statusCounts = allOrders.stream()
                                .collect(Collectors.groupingBy(o -> o.getStatus().name(), Collectors.counting()));

                // Sales by product (Top items)
                Map<String, Integer> productQuantities = new HashMap<>();
                Map<String, BigDecimal> productRevenues = new HashMap<>();

                for (Order order : allOrders) {
                        if (order.getPaymentStatus() == PaymentStatus.PAID) {
                                for (OrderItem item : order.getItems()) {
                                        String name = item.getProductName();
                                        productQuantities.put(name,
                                                        productQuantities.getOrDefault(name, 0) + item.getQuantity());
                                        productRevenues.put(name, productRevenues.getOrDefault(name, BigDecimal.ZERO)
                                                        .add(item.getTotalPrice()));
                                }
                        }
                }

                // Sort Top Products by quantities
                List<Map<String, Object>> topProducts = productQuantities.entrySet().stream()
                                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                                .limit(5)
                                .map(entry -> {
                                        Map<String, Object> pMap = new HashMap<>();
                                        pMap.put("productName", entry.getKey());
                                        pMap.put("quantitySold", entry.getValue());
                                        pMap.put("totalRevenue", productRevenues.get(entry.getKey()));
                                        return pMap;
                                })
                                .collect(Collectors.toList());

                // Daily sales breakdown (last 7 days)
                List<Map<String, Object>> dailySales = new ArrayList<>();
                for (int i = 6; i >= 0; i--) {
                        LocalDate date = LocalDate.now().minusDays(i);

                        BigDecimal orderSales = allOrders.stream()
                                        .filter(o -> o.getPaymentStatus() == PaymentStatus.PAID &&
                                                     o.getCreatedAt() != null && o.getCreatedAt().toLocalDate().equals(date))
                                        .map(Order::getFinalAmount)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                        BigDecimal paymentSales = allPayments.stream()
                                        .filter(p -> p.getPaymentStatus() == PaymentStatus.PAID &&
                                                     p.getVerifiedAt() != null && p.getVerifiedAt().toLocalDate().equals(date))
                                        .map(Payment::getAmount)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                        BigDecimal salesVal = orderSales.max(paymentSales);

                        long orderCount = allOrders.stream()
                                        .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().toLocalDate().equals(date))
                                        .count();

                        Map<String, Object> dayMap = new HashMap<>();
                        dayMap.put("date", date.format(DateTimeFormatter.ofPattern("MM-dd")));
                        dayMap.put("revenue", salesVal);
                        dayMap.put("orders", orderCount);
                        dailySales.add(dayMap);
                }

                Map<String, Object> analytics = new HashMap<>();
                analytics.put("paymentMethodDistribution", paymentMethodCounts);
                analytics.put("orderStatusCounts", statusCounts);
                analytics.put("topProducts", topProducts);
                analytics.put("dailySalesBreakdown", dailySales);
                analytics.put("averageOrderValue", allOrders.isEmpty() ? BigDecimal.ZERO
                                : allOrders.stream()
                                                .map(Order::getFinalAmount)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                                                .divide(new BigDecimal(allOrders.size()), 2, RoundingMode.HALF_UP));

                return analytics;
        }
}
