package com.safewalk.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Random;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.safewalk.model.OtpCode;
import com.safewalk.repository.OtpCodeRepository;

@Service
public class OtpService {

    private final OtpCodeRepository otpRepository;
    private final PasswordEncoder encoder;

    @Value("${otp.expiry-minutes:5}")
    private int expiryMinutes;

    @Value("${otp.max-attempts:5}")
    private int maxAttempts;

    @Value("${otp.dev-mode:true}")
    private boolean devMode;

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.from-number:}")
    private String fromNumber;

    private final Random random = new Random();

    public OtpService(
            OtpCodeRepository otpRepository,
            PasswordEncoder encoder) {
        this.otpRepository = otpRepository;
        this.encoder = encoder;
    }

    public void sendOtp(String phoneNumber, String purpose) {

        String code = String.format(
                "%06d",
                random.nextInt(1_000_000)
        );

        OtpCode otp = new OtpCode();
        otp.setPhoneNumber(phoneNumber);
        otp.setPurpose(purpose);
        otp.setCodeHash(encoder.encode(code));
        otp.setExpiresAt(
                LocalDateTime.now().plusMinutes(expiryMinutes)
        );
        otp.setAttempts(0);
        otp.setUsed(false);

        otpRepository.save(otp);

        if (devMode) {
            System.out.println();
            System.out.println("==========================================");
            System.out.println(" SafeWalk OTP");
            System.out.println(" Phone  : " + phoneNumber);
            System.out.println(" Purpose: " + purpose);
            System.out.println(" OTP    : " + code);
            System.out.println(" Expires: " + expiryMinutes + " minutes");
            System.out.println("==========================================");
            System.out.println();
            return;
        }

        sendViaTwilio(phoneNumber, code);
    }

    public boolean verifyOtp(
            String phoneNumber,
            String purpose,
            String code) {

        OtpCode otp =
                otpRepository
                        .findTopByPhoneNumberAndPurposeAndUsedFalseOrderByCreatedAtDesc(
                                phoneNumber,
                                purpose
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "OTP not found. Request a new OTP."
                                )
                        );

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "OTP expired. Request a new OTP."
            );
        }

        if (otp.getAttempts() >= maxAttempts) {
            throw new IllegalArgumentException(
                    "Too many incorrect OTP attempts. Request a new OTP."
            );
        }

        otp.setAttempts(otp.getAttempts() + 1);

        if (!encoder.matches(code, otp.getCodeHash())) {
            otpRepository.save(otp);
            throw new IllegalArgumentException("Invalid OTP.");
        }

        otp.setUsed(true);
        otpRepository.save(otp);

        return true;
    }

    private void sendViaTwilio(
            String phoneNumber,
            String code) {

        if (accountSid.isBlank()
                || authToken.isBlank()
                || fromNumber.isBlank()) {
            throw new IllegalStateException(
                    "Twilio is not configured. Set TWILIO_ACCOUNT_SID, "
                    + "TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER."
            );
        }

        try {
            String url =
                    "https://api.twilio.com/2010-04-01/Accounts/"
                            + accountSid
                            + "/Messages.json";

            String form =
                    "To=" + encode(phoneNumber)
                    + "&From=" + encode(fromNumber)
                    + "&Body=" + encode(
                            "SafeWalk verification code: "
                                    + code
                                    + ". Valid for "
                                    + expiryMinutes
                                    + " minutes."
                    );

            String credentials =
                    Base64.getEncoder()
                            .encodeToString(
                                    (accountSid + ":" + authToken)
                                            .getBytes()
                            );

            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .header(
                                    "Authorization",
                                    "Basic " + credentials
                            )
                            .header(
                                    "Content-Type",
                                    "application/x-www-form-urlencoded"
                            )
                            .POST(
                                    HttpRequest.BodyPublishers.ofString(form)
                            )
                            .build();

            HttpResponse<String> response =
                    HttpClient.newHttpClient()
                            .send(
                                    request,
                                    HttpResponse.BodyHandlers.ofString()
                            );

            if (response.statusCode() < 200
                    || response.statusCode() >= 300) {
                throw new IllegalStateException(
                        "SMS provider rejected the OTP request: "
                                + response.body()
                );
            }

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Unable to send OTP SMS.",
                    e
            );
        }
    }

    private String encode(String value) {
        return java.net.URLEncoder
                .encode(
                        value,
                        java.nio.charset.StandardCharsets.UTF_8
                );
    }
}
