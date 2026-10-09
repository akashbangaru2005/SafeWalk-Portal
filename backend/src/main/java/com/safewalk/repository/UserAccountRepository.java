package com.safewalk.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.safewalk.model.UserAccount;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

}