package com.cafeflow.service;

public interface NotificationProvider {
    String sendWhatsApp(String mobileNumber, String message);
}
