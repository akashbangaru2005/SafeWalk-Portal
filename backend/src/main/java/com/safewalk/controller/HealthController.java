package com.safewalk.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/")
    public String home() {
        return "SafeWalk Backend is running";
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}