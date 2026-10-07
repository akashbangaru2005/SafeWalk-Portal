package com.safewalk.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.safewalk.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/user/check")
    public ResponseEntity<?> checkUserPin(
            @RequestBody Map<String, String> body
    ) {

        String pin =
                body.getOrDefault("pin", "");

        if (!pin.matches("\\d{4}")) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "PIN must contain exactly 4 digits"
                    ));
        }

        return ResponseEntity.ok(
                Map.of(
                        "exists",
                        auth.userPinExists(pin)
                )
        );
    }

    @PostMapping("/user/register")
    public ResponseEntity<?> registerUser(
            @RequestBody Map<String, String> body
    ) {

        String pin =
                body.getOrDefault("pin", "");

        try {

            return ResponseEntity.ok(
                    auth.registerUser(pin)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(409)
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }

    @PostMapping("/user")
    public ResponseEntity<?> loginUser(
            @RequestBody Map<String, String> body
    ) {

        String pin =
                body.getOrDefault("pin", "");

        if (!pin.matches("\\d{4}")) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "PIN must contain exactly 4 digits"
                    ));
        }

        try {

            return ResponseEntity.ok(
                    auth.loginUser(pin)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(401)
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }

    @PostMapping("/user/forgot-pin")
    public ResponseEntity<?> forgotPin(
            @RequestBody Map<String, String> body
    ) {

        String recoveryCode =
                body.getOrDefault(
                        "recoveryCode",
                        ""
                );

        String newPin =
                body.getOrDefault(
                        "newPin",
                        ""
                );

        try {

            return ResponseEntity.ok(
                    auth.resetUserPin(
                            recoveryCode,
                            newPin
                    )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(401)
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }

    @PostMapping("/admin")
    public ResponseEntity<?> loginAdmin(
            @RequestBody Map<String, String> body
    ) {

        String password =
                body.getOrDefault(
                        "password",
                        ""
                );

        if (!password.matches("\\d{10}")) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "Admin password must contain exactly 10 digits"
                    ));
        }

        try {

            return ResponseEntity.ok(
                    auth.loginAdmin(password)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(401)
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }
}