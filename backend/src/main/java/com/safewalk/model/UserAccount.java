package com.safewalk.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pin_hash", nullable = false)
    private String pinHash;

    @Column(name = "recovery_code_hash")
    private String recoveryCodeHash;

    public UserAccount() {
    }

    public UserAccount(String pinHash, String recoveryCodeHash) {
        this.pinHash = pinHash;
        this.recoveryCodeHash = recoveryCodeHash;
    }

    public Long getId() {
        return id;
    }

    public String getPinHash() {
        return pinHash;
    }

    public void setPinHash(String pinHash) {
        this.pinHash = pinHash;
    }

    public String getRecoveryCodeHash() {
        return recoveryCodeHash;
    }

    public void setRecoveryCodeHash(String recoveryCodeHash) {
        this.recoveryCodeHash = recoveryCodeHash;
    }
}