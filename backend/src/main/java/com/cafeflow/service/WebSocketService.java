package com.cafeflow.service;

import com.cafeflow.dto.OrderDto;
import com.cafeflow.dto.PaymentDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastNewOrder(OrderDto orderDto) {
        log.info("WS Broadcast: New order received: {}", orderDto.getOrderIdFormatted());
        messagingTemplate.convertAndSend("/topic/admin/orders", orderDto);
    }

    public void broadcastOrderStatusUpdate(OrderDto orderDto) {
        log.info("WS Broadcast: Order status update: {} -> {}", orderDto.getOrderIdFormatted(), orderDto.getStatus());
        messagingTemplate.convertAndSend("/topic/admin/orders", orderDto);
        messagingTemplate.convertAndSend("/topic/customer/orders/" + orderDto.getOrderIdFormatted(), orderDto);
    }

    public void broadcastPaymentUpdate(PaymentDto paymentDto) {
        log.info("WS Broadcast: Payment update for order: {} -> {}", paymentDto.getOrderIdFormatted(), paymentDto.getPaymentStatus());
        messagingTemplate.convertAndSend("/topic/admin/orders", paymentDto);
        messagingTemplate.convertAndSend("/topic/customer/orders/" + paymentDto.getOrderIdFormatted() + "/payment", paymentDto);
    }
}
