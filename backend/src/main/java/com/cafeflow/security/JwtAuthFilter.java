package com.cafeflow.security;

import com.cafeflow.entity.Admin;
import com.cafeflow.entity.Customer;
import com.cafeflow.repository.AdminRepository;
import com.cafeflow.repository.CustomerRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final AdminRepository adminRepository;
    private final CustomerRepository customerRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String subject = jwtUtils.getSubjectFromToken(jwt);
                Claims claims = jwtUtils.getClaimsFromToken(jwt);
                String tokenType = claims.get("type", String.class);

                UserDetails userDetails = null;

                if ("ADMIN".equals(tokenType)) {
                    Admin admin = adminRepository.findByEmail(subject).orElse(null);
                    if (admin != null) {
                        userDetails = new AdminPrincipal(admin);
                    }
                } else if ("CUSTOMER".equals(tokenType)) {
                    Customer customer = customerRepository.findByMobileNumber(subject).orElse(null);
                    if (customer != null) {
                        userDetails = new CustomerPrincipal(customer);
                    }
                }

                if (userDetails != null) {
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}
