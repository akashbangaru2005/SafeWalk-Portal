package com.safewalk.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.safewalk.model.OtpCode;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    Optional<OtpCode> findTopByPhoneNumberAndPurposeAndUsedFalseOrderByCreatedAtDesc(
            String phoneNumber,
            String purpose
    );
}
