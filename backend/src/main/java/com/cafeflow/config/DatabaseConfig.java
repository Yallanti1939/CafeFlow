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
        System.out.println("=================================================================");
        System.out.println(">>> [CafeFlow] Environment Variable Diagnostics:");
        System.getenv().forEach((k, v) -> {
            String keyUpper = k.toUpperCase();
            if (keyUpper.contains("DATA") || keyUpper.contains("POSTGRES") || keyUpper.contains("SPRING") || keyUpper.contains("DB") || keyUpper.contains("URL")) {
                String val = keyUpper.contains("PASS") || keyUpper.contains("SECRET") ? "******" : v;
                System.out.println("    " + k + " = " + val);
            }
        });
        System.out.println("=================================================================");

        // Lookup across all potential cloud provider env var keys
        String envUrl = findEnvVar("SPRING_DATASOURCE_URL", "DATABASE_URL", "POSTGRES_URL", "JDBC_DATABASE_URL", "DB_URL", "RENDER_POSTGRES_URL");
        String url = (envUrl != null && !envUrl.isBlank()) ? envUrl : dbUrl;

        String envUser = findEnvVar("SPRING_DATASOURCE_USERNAME", "DATABASE_USERNAME", "POSTGRES_USER", "DB_USER", "DATABASE_USER");
        String username = (envUser != null && !envUser.isBlank()) ? envUser : dbUser;

        String envPass = findEnvVar("SPRING_DATASOURCE_PASSWORD", "DATABASE_PASSWORD", "POSTGRES_PASSWORD", "DB_PASSWORD");
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

        System.out.println(">>> [CafeFlow] Target JDBC Connection URL: " + url + " (User: " + username + ")");

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(url)
                .username(username)
                .password(password)
                .build();
    }

    private String findEnvVar(String... keys) {
        for (String key : keys) {
            String val = System.getenv(key);
            if (val != null && !val.isBlank()) {
                return val;
            }
        }
        return null;
    }
}
