package com.safewalk.service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.safewalk.model.UserAccount;
import com.safewalk.repository.UserAccountRepository;

@Service
public class AuthService {

    private final UserAccountRepository users;
    private final PasswordEncoder encoder;

    private final Map<String, Long> sessions = new ConcurrentHashMap<>();

    @Value("${safewalk.admin.password:1234567890}")
    private String adminPassword;

    private static final String RECOVERY_CODE = "123456";

    public AuthService(
            UserAccountRepository users,
            PasswordEncoder encoder) {

        this.users = users;
        this.encoder = encoder;
    }

    public boolean userPinExists(String pin) {

        if (pin == null || !pin.matches("\\d{4}")) {
            return false;
        }

        return users.findAll()
                .stream()
                .anyMatch(user ->
                        user.getPinHash() != null
                        && encoder.matches(pin, user.getPinHash()));
    }

    public Map<String, Object> registerUser(String pin) {

        if (pin == null || !pin.matches("\\d{4}")) {
            throw new IllegalArgumentException(
                    "PIN must contain exactly 4 digits");
        }

        if (userPinExists(pin)) {
            throw new IllegalArgumentException(
                    "This PIN is already registered");
        }

        UserAccount user = new UserAccount(
                encoder.encode(pin),
                encoder.encode(RECOVERY_CODE));

        users.save(user);

        return Map.of(
                "success", true,
                "message", "User registered successfully",
                "recoveryCode", RECOVERY_CODE
        );
    }

    public Map<String, Object> loginUser(String pin) {

        if (pin == null || !pin.matches("\\d{4}")) {
            throw new IllegalArgumentException(
                    "PIN must contain exactly 4 digits");
        }

        UserAccount user = findByPin(pin);

        if (user == null) {
            throw new IllegalArgumentException("Invalid PIN");
        }

        String token = UUID.randomUUID().toString();

        sessions.put(token, user.getId());

        return Map.of(
                "success", true,
                "message", "Login successful",
                "token", token,
                "userId", user.getId(),
                "role", "USER"
        );
    }

    public Map<String, Object> loginAdmin(String password) {

        if (password == null || !password.matches("\\d{10}")) {
            throw new IllegalArgumentException(
                    "Admin password must contain exactly 10 digits");
        }

        if (!password.equals(adminPassword)) {
            throw new IllegalArgumentException(
                    "Invalid admin password");
        }

        String token = UUID.randomUUID().toString();

        sessions.put(token, -1L);

        return Map.of(
                "success", true,
                "message", "Admin login successful",
                "token", token,
                "role", "ADMIN"
        );
    }

    public Map<String, Object> resetUserPin(
            String recoveryCode,
            String newPin) {

        if (recoveryCode == null
                || !recoveryCode.matches("\\d{6}")) {

            throw new IllegalArgumentException(
                    "Recovery code must contain exactly 6 digits");
        }

        if (newPin == null
                || !newPin.matches("\\d{4}")) {

            throw new IllegalArgumentException(
                    "New PIN must contain exactly 4 digits");
        }

        UserAccount user = users.findAll()
                .stream()
                .filter(u ->
                        u.getRecoveryCodeHash() != null
                        && encoder.matches(
                                recoveryCode,
                                u.getRecoveryCodeHash()))
                .findFirst()
                .orElse(null);

        if (user == null) {
            throw new IllegalArgumentException(
                    "Invalid recovery code");
        }

        if (userPinExists(newPin)) {
            throw new IllegalArgumentException(
                    "This PIN is already registered");
        }

        user.setPinHash(encoder.encode(newPin));

        users.save(user);

        return Map.of(
                "success", true,
                "message", "PIN reset successfully"
        );
    }

    /*
     * Existing controllers use this method to validate
     * the session and authorization role.
     */
    public void require(String token, String role) {

        if (!isValidToken(token)) {
            throw new IllegalArgumentException(
                    "Invalid or expired session token");
        }

        Long userId = sessions.get(token);

        boolean isAdmin = Long.valueOf(-1L).equals(userId);

        if ("ADMIN".equalsIgnoreCase(role) && !isAdmin) {
            throw new IllegalArgumentException(
                    "Admin authorization required");
        }

        if ("USER".equalsIgnoreCase(role) && isAdmin) {
            throw new IllegalArgumentException(
                    "User authorization required");
        }

        if (!"ADMIN".equalsIgnoreCase(role)
                && !"USER".equalsIgnoreCase(role)) {

            throw new IllegalArgumentException(
                    "Unknown authorization role: " + role);
        }
    }

    public boolean isValidToken(String token) {

        return token != null
                && !token.isBlank()
                && sessions.containsKey(token);
    }

    public boolean isAdminToken(String token) {

        return isValidToken(token)
                && Long.valueOf(-1L).equals(sessions.get(token));
    }

    public Long getUserIdFromToken(String token) {

        if (!isValidToken(token)) {
            return null;
        }

        Long userId = sessions.get(token);

        if (userId == null || userId == -1L) {
            return null;
        }

        return userId;
    }

    public void logout(String token) {

        if (token != null) {
            sessions.remove(token);
        }
    }

    private UserAccount findByPin(String pin) {

        return users.findAll()
                .stream()
                .filter(user ->
                        user.getPinHash() != null
                        && encoder.matches(
                                pin,
                                user.getPinHash()))
                .findFirst()
                .orElse(null);
    }
}