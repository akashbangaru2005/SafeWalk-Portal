package com.safewalk.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.safewalk.model.SessionToken;
import com.safewalk.model.UserAccount;
import com.safewalk.repository.SessionTokenRepository;
import com.safewalk.repository.UserAccountRepository;

@Service
public class AuthService {

    private final UserAccountRepository users;
    private final SessionTokenRepository sessions;
    private final PasswordEncoder encoder;

    private final String adminPassword;

    private final SecureRandom random =
            new SecureRandom();

    public AuthService(
            UserAccountRepository users,
            SessionTokenRepository sessions,
            PasswordEncoder encoder,
            @Value("${safewalk.admin.password:1234567890}")
            String adminPassword
    ) {
        this.users = users;
        this.sessions = sessions;
        this.encoder = encoder;
        this.adminPassword = adminPassword;
    }

    public boolean userPinExists(String pin) {

        List<UserAccount> allUsers =
                users.findAll();

        for (UserAccount user : allUsers) {

            if (encoder.matches(
                    pin,
                    user.getPinHash()
            )) {
                return true;
            }
        }

        return false;
    }

    public Map<String, Object> registerUser(
            String pin
    ) {

        if (!pin.matches("\\d{4}")) {
            throw new IllegalArgumentException(
                    "PIN must contain exactly 4 digits"
            );
        }

        if (userPinExists(pin)) {
            throw new IllegalArgumentException(
                    "This PIN is already registered"
            );
        }

        String recoveryCode =
                generateRecoveryCode();

        UserAccount user =
                new UserAccount();

        user.setPinHash(
                encoder.encode(pin)
        );

        user.setRecoveryCodeHash(
                encoder.encode(recoveryCode)
        );

        UserAccount saved =
                users.save(user);

        SessionToken session =
                createSession(
                        "USER",
                        saved.getId()
                );

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "token",
                session.getToken()
        );

        response.put(
                "role",
                "USER"
        );

        response.put(
                "userId",
                saved.getId()
        );

        response.put(
                "recoveryCode",
                recoveryCode
        );

        return response;
    }

    public Map<String, Object> loginUser(
            String pin
    ) {

        UserAccount matched = null;

        for (UserAccount user :
                users.findAll()) {

            if (encoder.matches(
                    pin,
                    user.getPinHash()
            )) {
                matched = user;
                break;
            }
        }

        if (matched == null) {
            throw new IllegalArgumentException(
                    "Invalid PIN"
            );
        }

        SessionToken session =
                createSession(
                        "USER",
                        matched.getId()
                );

        return sessionResponse(session);
    }

    public Map<String, Object> resetUserPin(
            String recoveryCode,
            String newPin
    ) {

        if (!recoveryCode.matches("\\d{6}")) {
            throw new IllegalArgumentException(
                    "Recovery code must contain exactly 6 digits"
            );
        }

        if (!newPin.matches("\\d{4}")) {
            throw new IllegalArgumentException(
                    "New PIN must contain exactly 4 digits"
            );
        }

        UserAccount matched = null;

        for (UserAccount user :
                users.findAll()) {

            if (encoder.matches(
                    recoveryCode,
                    user.getRecoveryCodeHash()
            )) {
                matched = user;
                break;
            }
        }

        if (matched == null) {
            throw new IllegalArgumentException(
                    "Invalid recovery code"
            );
        }

        if (userPinExists(newPin)) {
            throw new IllegalArgumentException(
                    "This PIN is already registered"
            );
        }

        matched.setPinHash(
                encoder.encode(newPin)
        );

        users.save(matched);

        SessionToken session =
                createSession(
                        "USER",
                        matched.getId()
                );

        return sessionResponse(session);
    }

    public Map<String, Object> loginAdmin(
            String password
    ) {

        if (!password.equals(adminPassword)) {
            throw new IllegalArgumentException(
                    "Invalid administrator password"
            );
        }

        SessionToken session =
                createSession(
                        "ADMIN",
                        null
                );

        return sessionResponse(session);
    }

    public SessionToken require(
            String token,
            String expectedRole
    ) {

        if (token == null ||
                token.isBlank()) {

            throw new IllegalArgumentException(
                    "Missing session token"
            );
        }

        SessionToken session =
                sessions.findByToken(token)
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "Invalid session token"
                                )
                        );

        if (session.getExpiresAt()
                .isBefore(LocalDateTime.now())) {

            sessions.delete(session);

            throw new IllegalArgumentException(
                    "Session expired"
            );
        }

        if (!expectedRole.equals(
                session.getRole()
        )) {

            throw new IllegalArgumentException(
                    "Access denied"
            );
        }

        return session;
    }

    private SessionToken createSession(
            String role,
            Long userId
    ) {

        SessionToken session =
                new SessionToken();

        session.setToken(
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
        );

        session.setRole(role);
        session.setUserId(userId);

        session.setExpiresAt(
                LocalDateTime.now()
                        .plusHours(12)
        );

        return sessions.save(session);
    }

    private Map<String, Object> sessionResponse(
            SessionToken session
    ) {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "token",
                session.getToken()
        );

        response.put(
                "role",
                session.getRole()
        );

        response.put(
                "userId",
                session.getUserId()
        );

        response.put(
                "expiresAt",
                session.getExpiresAt()
        );

        return response;
    }

    private String generateRecoveryCode() {

        int value =
                100000 +
                random.nextInt(900000);

        return String.valueOf(value);
    }
}