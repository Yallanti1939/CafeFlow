package com.cafeflow.service;

import com.cafeflow.dto.*;
import com.cafeflow.entity.*;
import com.cafeflow.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final CartService cartService;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;
    
    // Lazy injections to avoid circular dependencies
    private final NotificationService notificationService;
    private final WebSocketService webSocketService;

    @Transactional
    public OrderDto createOrder(Long customerId, OrderRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        Cart cart = cartService.getOrCreateCart(customerId);
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cannot place order. Cart is empty.");
        }

        // Calculate Totals
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        Order order = new Order();
        order.setCustomer(customer);
        order.setPaymentMethod(PaymentMethod.valueOf(request.getPaymentMethod()));
        order.setStatus(OrderStatus.PLACED);
        
        // Counter pay defaults to PENDING. UPI/Card start as PENDING until verified.
        order.setPaymentStatus(PaymentStatus.PENDING);

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            if (!product.getIsActive() || !product.getIsVisible() || product.getAvailabilityStatus() == AvailabilityStatus.UNAVAILABLE) {
                throw new IllegalStateException("Product " + product.getName() + " is currently unavailable.");
            }
            if (product.getAvailabilityStatus() == AvailabilityStatus.OUT_OF_STOCK) {
                throw new IllegalStateException("Product " + product.getName() + " is out of stock.");
            }

            subtotal = subtotal.add(cartItem.getFinalPrice());

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(product.getName())
                    .productImageUrl(product.getImageUrl())
                    .quantity(cartItem.getQuantity())
                    .unitBasePrice(cartItem.getBasePrice())
                    .customizationTotal(cartItem.getCustomizationPrice())
                    .unitFinalPrice(cartItem.getBasePrice().add(cartItem.getCustomizationPrice()))
                    .totalPrice(cartItem.getFinalPrice())
                    .build();

            // Customizations
            List<SelectedCustomizationOptionDto> opts = deserializeCustomizations(cartItem.getSelectedCustomizations());
            List<OrderItemCustomization> itemCustoms = opts.stream()
                    .map(o -> OrderItemCustomization.builder()
                            .orderItem(orderItem)
                            .customizationGroupName(o.getGroupName())
                            .customizationOptionName(o.getOptionName())
                            .additionalPrice(o.getPrice())
                            .build())
                    .collect(Collectors.toList());
            orderItem.setCustomizations(itemCustoms);
            orderItems.add(orderItem);
        }

        order.setItems(orderItems);
        order.setSubtotal(subtotal);

        // Tax
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
        order.setTax(tax);

        // Discount
        BigDecimal discount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;
        order.setDiscount(discount);

        // Final Amount
        BigDecimal finalAmount = subtotal.add(tax).subtract(discount).setScale(2, RoundingMode.HALF_UP);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }
        order.setFinalAmount(finalAmount);

        // Format Order ID
        String mobile = customer.getMobileNumber();
        String mobilePrefix = mobile.substring(0, Math.min(4, mobile.length()));
        // Make sure it contains digits only
        mobilePrefix = mobilePrefix.replaceAll("\\D", "");
        if (mobilePrefix.isEmpty()) {
            mobilePrefix = "9999";
        }

        // Draw next sequence value
        Long seqVal = ((Number) entityManager.createNativeQuery("SELECT nextval('order_number_seq')").getSingleResult()).longValue();
        String formattedOrderId = String.format("%s-ORD-%07d", mobilePrefix, seqVal);
        order.setOrderIdFormatted(formattedOrderId);

        // Save order
        Order savedOrder = orderRepository.save(order);

        // Log history
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(savedOrder)
                .status(OrderStatus.PLACED)
                .changedById(customerId)
                .changedByType("CUSTOMER")
                .notes("Order placed by customer.")
                .build();
        statusHistoryRepository.save(history);

        // Clear cart
        cartService.clearCart(customerId);

        // Notify Admins and Customer (WhatsApp and WebSockets)
        try {
            if (savedOrder.getPaymentMethod() == PaymentMethod.COUNTER_PAY) {
                notificationService.sendWhatsAppNotification(savedOrder, "COUNTER_PAYMENT_PENDING");
            } else {
                notificationService.sendWhatsAppNotification(savedOrder, "ORDER_CONFIRMED");
            }
            webSocketService.broadcastNewOrder(mapToDto(savedOrder));
        } catch (Exception e) {
            log.error("Failed to process notifications for order: {}", savedOrder.getOrderIdFormatted(), e);
        }

        return mapToDto(savedOrder);
    }

    public OrderDto getOrderByIdFormatted(String orderIdFormatted) {
        Order order = orderRepository.findByOrderIdFormatted(orderIdFormatted)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderIdFormatted));
        return mapToDto(order);
    }

    public List<OrderDto> getCustomerOrderHistory(Long customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<OrderDto> getAllOrdersForAdmin() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, OrderStatus newStatus, Long adminId, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);

        // Log transition history
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(savedOrder)
                .status(newStatus)
                .changedById(adminId)
                .changedByType("ADMIN")
                .notes(notes != null ? notes : "Status updated from " + oldStatus + " to " + newStatus)
                .build();
        statusHistoryRepository.save(history);

        // Broadcast status update
        try {
            webSocketService.broadcastOrderStatusUpdate(mapToDto(savedOrder));
            
            // Send WhatsApp status notification
            notificationService.sendWhatsAppNotification(savedOrder, "ORDER_STATUS_UPDATED");
            
            if (newStatus == OrderStatus.COMPLETED) {
                notificationService.sendWhatsAppNotification(savedOrder, "FEEDBACK_REQUEST");
            }
        } catch (Exception e) {
            log.error("Failed to broadcast WS/WhatsApp for order status change", e);
        }

        return mapToDto(savedOrder);
    }

    @Transactional
    public OrderDto cancelOrder(Long orderId, String notes, boolean isAdmin, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!isAdmin && order.getStatus() != OrderStatus.PLACED) {
            throw new IllegalStateException("Customers can only cancel orders in PLACED status.");
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(savedOrder)
                .status(OrderStatus.CANCELLED)
                .changedById(userId)
                .changedByType(isAdmin ? "ADMIN" : "CUSTOMER")
                .notes(notes != null ? notes : "Order cancelled.")
                .build();
        statusHistoryRepository.save(history);

        try {
            webSocketService.broadcastOrderStatusUpdate(mapToDto(savedOrder));
            notificationService.sendWhatsAppNotification(savedOrder, "ORDER_STATUS_UPDATED");
        } catch (Exception e) {
            log.error("Failed to broadcast cancel order alerts", e);
        }

        return mapToDto(savedOrder);
    }

    public List<OrderStatusHistoryDto> getOrderStatusHistory(String orderIdFormatted) {
        Order order = orderRepository.findByOrderIdFormatted(orderIdFormatted)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        return statusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId()).stream()
                .map(h -> OrderStatusHistoryDto.builder()
                        .id(h.getId())
                        .orderId(h.getOrder().getId())
                        .status(h.getStatus().name())
                        .changedByType(h.getChangedByType())
                        .notes(h.getNotes())
                        .createdAt(h.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
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

    public OrderDto mapToDto(Order entity) {
        List<OrderItemDto> items = entity.getItems() == null ? Collections.emptyList() :
                entity.getItems().stream()
                        .map(item -> OrderItemDto.builder()
                                .id(item.getId())
                                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                                .productName(item.getProductName())
                                .productImageUrl(item.getProductImageUrl())
                                .quantity(item.getQuantity())
                                .unitBasePrice(item.getUnitBasePrice())
                                .customizationTotal(item.getCustomizationTotal())
                                .unitFinalPrice(item.getUnitFinalPrice())
                                .totalPrice(item.getTotalPrice())
                                .customizations(item.getCustomizations() == null ? Collections.emptyList() :
                                        item.getCustomizations().stream()
                                                .map(c -> OrderItemCustomizationDto.builder()
                                                        .id(c.getId())
                                                        .customizationGroupName(c.getCustomizationGroupName())
                                                        .customizationOptionName(c.getCustomizationOptionName())
                                                        .additionalPrice(c.getAdditionalPrice())
                                                        .build())
                                                .collect(Collectors.toList()))
                                .build())
                        .collect(Collectors.toList());

        return OrderDto.builder()
                .id(entity.getId())
                .orderIdFormatted(entity.getOrderIdFormatted())
                .customerId(entity.getCustomer().getId())
                .customerMobile(entity.getCustomer().getMobileNumber())
                .subtotal(entity.getSubtotal())
                .tax(entity.getTax())
                .discount(entity.getDiscount())
                .finalAmount(entity.getFinalAmount())
                .status(entity.getStatus().name())
                .paymentMethod(entity.getPaymentMethod().name())
                .paymentStatus(entity.getPaymentStatus().name())
                .items(items)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
