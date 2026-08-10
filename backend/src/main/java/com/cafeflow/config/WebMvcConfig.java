package com.cafeflow.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.io.IOException;
import java.nio.file.*;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${cafeflow.upload.dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir);
        String absPath = uploadPath.toFile().getAbsolutePath();
        
        // Ensure folder exists
        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            System.err.println("Could not create local upload folder: " + e.getMessage());
        }

        String resourceLocation = "file:" + absPath + "/";
        if (System.getProperty("os.name").toLowerCase().contains("win")) {
            resourceLocation = "file:/" + absPath.replace("\\", "/") + "/";
        }

        registry.addResourceHandler("/uploads/products/**")
                .addResourceLocations(resourceLocation);
    }
}
