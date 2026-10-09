package com.safewalk.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.safewalk.model.IssueReport;
import com.safewalk.model.ReportStatus;
import com.safewalk.repository.IssueReportRepository;
import com.safewalk.service.AuthService;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final IssueReportRepository reports;
    private final AuthService auth;

    @Value("${safewalk.upload-dir:uploads}")
    private String uploadDir;

    public ReportController(
            IssueReportRepository reports,
            AuthService auth
    ) {
        this.reports = reports;
        this.auth = auth;
    }

    // =========================================================
    // CREATE REPORT
    // =========================================================

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createReport(

            @RequestHeader(
                    value = "X-Session-Token",
                    required = false
            )
            String token,

            @RequestParam("issueType")
            String issueType,

            @RequestParam(value = "description", required = false)
            String description,

            @RequestParam("latitude")
            Double latitude,

            @RequestParam("longitude")
            Double longitude,

            @RequestParam(value = "address", required = false)
            String address,

            @RequestPart(
                    value = "photo",
                    required = false
            )
            MultipartFile photo
    ) {

        try {

            // -------------------------------------------------
            // AUTHENTICATION
            // -------------------------------------------------

            auth.require(token, "USER");
            Long userId = auth.getUserIdFromToken(token);

            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------

            if (issueType == null || issueType.isBlank()) {
                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "Issue type is required"
                        ));
            }

            if (latitude == null ||
                    latitude < -90 ||
                    latitude > 90) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "Invalid latitude"
                        ));
            }

            if (longitude == null ||
                    longitude < -180 ||
                    longitude > 180) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "Invalid longitude"
                        ));
            }

            // -------------------------------------------------
            // SAVE PHOTO
            // -------------------------------------------------

            String photoUrl = null;

            if (photo != null && !photo.isEmpty()) {

                if (photo.getSize() > 10 * 1024 * 1024) {
                    return ResponseEntity
                            .badRequest()
                            .body(Map.of(
                                    "message",
                                    "Photo must be below 10 MB"
                            ));
                }

                Path uploadPath = Paths
                        .get(uploadDir)
                        .toAbsolutePath()
                        .normalize();

                // Create uploads folder if it doesn't exist
                Files.createDirectories(uploadPath);

                String originalName =
                        photo.getOriginalFilename();

                String extension = ".jpg";

                if (originalName != null &&
                        originalName.contains(".")) {

                    String detected =
                            originalName.substring(
                                    originalName.lastIndexOf(".")
                            );

                    if (detected.length() <= 10) {
                        extension =
                                detected.replaceAll(
                                        "[^A-Za-z0-9.]",
                                        ""
                                );
                    }
                }

                if (extension.isBlank()) {
                    extension = ".jpg";
                }

                String filename =
                        UUID.randomUUID() + extension;

                Path destination =
                        uploadPath
                                .resolve(filename)
                                .normalize();

                // Prevent path traversal
                if (!destination.startsWith(uploadPath)) {
                    return ResponseEntity
                            .badRequest()
                            .body(Map.of(
                                    "message",
                                    "Invalid photo path"
                            ));
                }

                // Actually save the uploaded file
                photo.transferTo(destination.toFile());

                // URL stored in MySQL
                photoUrl =
                        "/uploads/" + filename;
            }

            // -------------------------------------------------
            // CREATE REPORT
            // -------------------------------------------------

            IssueReport report =
                    new IssueReport();

            report.setUserId(
                    userId
            );

            report.setIssueType(
                    issueType
            );

            report.setDescription(
                    description
            );

            report.setLatitude(
                    latitude
            );

            report.setLongitude(
                    longitude
            );

            report.setAddress(
                    address
            );

            report.setPhotoUrl(
                    photoUrl
            );

            report.setStatus(
                    ReportStatus.OPEN
            );

            IssueReport saved =
                    reports.save(report);

            // -------------------------------------------------
            // RESPONSE
            // -------------------------------------------------

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message",
                            "Report submitted successfully",
                            "report", saved
                    )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(401)
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));

        } catch (IOException e) {

            org.slf4j.LoggerFactory
                    .getLogger(ReportController.class)
                    .error(
                            "Unable to save uploaded photo",
                            e
                    );

            return ResponseEntity
                    .status(500)
                    .body(Map.of(
                            "message",
                            "Unable to save uploaded photo",
                            "error",
                            e.getMessage() == null
                                    ? "Unknown file error"
                                    : e.getMessage()
                    ));

        } catch (RuntimeException e) {

            org.slf4j.LoggerFactory
                    .getLogger(ReportController.class)
                    .error(
                            "Unable to create report",
                            e
                    );

            return ResponseEntity
                    .status(500)
                    .body(Map.of(
                            "message",
                            "Unable to create report",
                            "error",
                            e.getMessage() == null
                                    ? "Unknown server error"
                                    : e.getMessage()
                    ));
        }
    }

    // =========================================================
    // USER - MY REPORTS
    // =========================================================

    @GetMapping("/mine")
    public ResponseEntity<?> getMyReports(

            @RequestHeader(
                    value = "X-Session-Token",
                    required = false
            )
            String token
    ) {

        try {

auth.require(token, "USER");

Long userId = auth.getUserIdFromToken(token);

List<IssueReport> result =
        reports.findByUserIdOrderByReportedAtDesc(userId);
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(401)
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));

        } catch (Exception e) {

            return ResponseEntity
                    .status(500)
                    .body(Map.of(
                            "message",
                            "Unable to load your reports"
                    ));
        }
    }

    // =========================================================
    // ADMIN - ALL REPORTS
    // =========================================================

  @GetMapping
public ResponseEntity<?> getAllReports(
        @RequestHeader(
                value = "X-Session-Token",
                required = false
        )
        String token
) {
    try {

        auth.require(token, "ADMIN");

        List<IssueReport> result =
                reports.findAllByOrderByReportedAtDesc();

        return ResponseEntity.ok(result);

    } catch (IllegalArgumentException e) {

        return ResponseEntity
                .status(401)
                .body(Map.of(
                        "message",
                        e.getMessage()
                ));

    } catch (Exception e) {

        org.slf4j.LoggerFactory
                .getLogger(ReportController.class)
                .error("Unable to load reports", e);

        return ResponseEntity
                .status(500)
                .body(Map.of(
                        "message",
                        "Unable to load reports"
                ));
    }
}

    // =========================================================
    // ADMIN - DASHBOARD STATS
    // =========================================================

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(

            @RequestHeader(
                    value = "X-Session-Token",
                    required = false
            )
            String token
    ) {

        try {

            auth.require(token, "ADMIN");

            List<IssueReport> allReports =
                    reports.findAllByOrderByReportedAtDesc();

            long total =
                    allReports.size();

            long open =
                    allReports.stream()
                            .filter(r ->
                                    r.getStatus() ==
                                            ReportStatus.OPEN
                            )
                            .count();

            long inProgress =
                    allReports.stream()
                            .filter(r ->
                                    r.getStatus() ==
                                            ReportStatus.IN_PROGRESS
                            )
                            .count();

            long resolved =
                    allReports.stream()
                            .filter(r ->
                                    r.getStatus() ==
                                            ReportStatus.RESOLVED
                            )
                            .count();

            return ResponseEntity.ok(
                    Map.of(
                            "total", total,
                            "open", open,
                            "inProgress", inProgress,
                            "resolved", resolved
                    )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(401)
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));

        } catch (Exception e) {

            org.slf4j.LoggerFactory
                    .getLogger(ReportController.class)
                    .error(
                            "Unable to load dashboard stats",
                            e
                    );

            return ResponseEntity
                    .status(500)
                    .body(Map.of(
                            "message",
                            "Unable to load dashboard stats"
                    ));
        }
    }

    // =========================================================
    // ADMIN - UPDATE STATUS
    // =========================================================

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(

            @RequestHeader(
                    value = "X-Session-Token",
                    required = false
            )
            String token,

            @PathVariable Long id,

            @RequestBody Map<String, String> body
    ) {

        try {

            auth.require(token, "ADMIN");

            IssueReport report =
                    reports.findById(id)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Report not found"
                                    )
                            );

            String status =
                    body.get("status");

            report.setStatus(
                    ReportStatus.valueOf(status)
            );

            IssueReport updated =
                    reports.save(report);

            return ResponseEntity.ok(updated);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));

        } catch (Exception e) {

            return ResponseEntity
                    .status(500)
                    .body(Map.of(
                            "message",
                            "Unable to update report"
                    ));
        }
    }
}