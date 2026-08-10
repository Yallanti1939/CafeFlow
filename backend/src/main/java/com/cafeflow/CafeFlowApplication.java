package com.cafeflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CafeFlowApplication {
    public static void main(String[] args) {
        SpringApplication.run(CafeFlowApplication.class, args);
    }
}
