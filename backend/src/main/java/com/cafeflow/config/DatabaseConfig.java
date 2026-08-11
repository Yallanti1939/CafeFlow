package com.cafeflow.config;

import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class DatabaseConfig {

    @Value("${SPRING_DATASOURCE_URL:${DATABASE_URL:jdbc:postgresql://localhost:5433/cafeflow}}")
    private String dbUrl;

    @Value("${SPRING_DATASOURCE_USERNAME:${DATABASE_USERNAME:postgres}}")
    private String dbUser;

    @Value("${SPRING_DATASOURCE_PASSWORD:${DATABASE_PASSWORD:Saiteja1939}}")
    private String dbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String envUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (envUrl == null || envUrl.isBlank()) {
            envUrl = System.getenv("DATABASE_URL");
        }
        String url = (envUrl != null && !envUrl.isBlank()) ? envUrl : dbUrl;

        String envUser = System.getenv("SPRING_DATASOURCE_USERNAME");
        if (envUser == null || envUser.isBlank()) {
            envUser = System.getenv("DATABASE_USERNAME");
        }
        String username = (envUser != null && !envUser.isBlank()) ? envUser : dbUser;

        String envPass = System.getenv("SPRING_DATASOURCE_PASSWORD");
        if (envPass == null || envPass.isBlank()) {
            envPass = System.getenv("DATABASE_PASSWORD");
        }
        String password = (envPass != null && !envPass.isBlank()) ? envPass : dbPassword;

        // Automatically format postgres:// or postgresql:// URIs into valid JDBC URLs
        if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
            try {
                java.net.URI uri = new java.net.URI(url);
                if (uri.getUserInfo() != null) {
                    String[] userParts = uri.getUserInfo().split(":");
                    username = userParts[0];
                    if (userParts.length > 1) {
                        password = userParts[1];
                    }
                }
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String host = uri.getHost();
                String path = uri.getPath();
                url = "jdbc:postgresql://" + host + ":" + port + path;
            } catch (Exception e) {
                if (!url.startsWith("jdbc:")) {
                    url = "jdbc:" + url;
                }
            }
        } else if (!url.startsWith("jdbc:")) {
            url = "jdbc:" + url;
        }

        System.out.println(">>> [CafeFlow] Initializing PostgreSQL DataSource with URL: " + url + ", User: " + username);

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(url)
                .username(username)
                .password(password)
                .build();
    }
}
