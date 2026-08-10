package com.cafeflow.repository;

import com.cafeflow.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findFirstByMobileNumberOrderByCreatedAtDesc(String mobileNumber);
    List<OtpVerification> findByMobileNumberAndVerifiedFalse(String mobileNumber);
}
