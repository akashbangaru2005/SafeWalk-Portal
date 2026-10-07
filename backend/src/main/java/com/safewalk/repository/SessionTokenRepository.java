package com.safewalk.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.safewalk.model.SessionToken;

public interface SessionTokenRepository
        extends JpaRepository<SessionToken, Long> {

    Optional<SessionToken> findByToken(String token);
}