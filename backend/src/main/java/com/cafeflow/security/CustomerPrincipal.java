package com.cafeflow.security;

import com.cafeflow.entity.Customer;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.Collections;

@RequiredArgsConstructor
@Getter
public class CustomerPrincipal implements UserDetails {

    private final Customer customer;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
    }

    public Long getId() {
        return customer.getId();
    }

    @Override
    public String getPassword() {
        return ""; // No password required for customers (OTP verified)
    }

    @Override
    public String getUsername() {
        return customer.getMobileNumber();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
