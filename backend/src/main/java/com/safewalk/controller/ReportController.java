package com.safewalk.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
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
import com.safewalk.model.SessionToken;
import com.safewalk.repository.IssueReportRepository;
import com.safewalk.service.AuthService;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final IssueReportRepository reports;
    private final AuthService auth;
    private final Path uploadDir;

    public ReportController(
            IssueReportRepository reports,
            AuthService auth,
            @Value("${safewalk.upload-dir:uploads}") String uploadDir
    ) throws IOException {

        this.reports = reports;
        this.auth = auth;

        this.uploadDir = Paths
                .get(uploadDir)
                .toAbsolutePath()
                .normalize();

        Files.createDirectories(this.uploadDir);
    }

    // ============================================================
    // CREATE USER REPORT
    // POST /api/reports
    // ============================================================

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> createReport(

            @RequestHeader(
                    value = "X-Session-Token",
                    required = false
            )
            String token,

            @RequestParam("issueType")
            String issueType,

            @RequestParam(
                    value = "description",
                    required = false
            )
            String description,

            @RequestParam("latitude")
            Double latitude,

            @RequestParam("longitude")
            Double longitude,

            @RequestParam(
                    value = "address",
                    required = false
            )
            String address,

            @RequestPart(
                    value = "photo",
                    required = false
            )
            MultipartFile photo

    ) {

        try {

            // ----------------------------------------------------
            // USER AUTHENTICATION
            // ----------------------------------------------------

            SessionToken session =
                    auth.require(token, "USER");

            // ----------------------------------------------------
            // VALIDATE ISSUE TYPE
            // ----------------------------------------------------

            if (issueType == null ||
                    issueType.isBlank()) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                Map.of(
                                        "message",
                                        "Issue type is required"
                                )
                        );
            }

            // ----------------------------------------------------
            // VALIDATE GPS
            // ----------------------------------------------------

            if (latitude == null ||
                    latitude < -90 ||
                    latitude > 90) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                Map.of(
                                        "message",
                                        "Invalid latitude"
                                )
                        );
            }

            if (longitude == null ||
                    longitude < -180 ||
                    longitude > 180) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                Map.of(
                                        "message",
                                        "Invalid longitude"
                                )
                        );
            }

            // ----------------------------------------------------
            // SAVE PHOTO
            // ----------------------------------------------------

            String photoUrl = null;

            if (photo != null &&
                    !photo.isEmpty()) {

                if (photo.getSize() >
                        10 * 1024 * 1024) {

                    return ResponseEntity
                            .badRequest()
                            .body(
                                    Map.of(
                                            "message",
                                            "Photo must be below 10 MB"
                                    )
                            );
                }

                String originalName =
                        Optional
                                .ofNullable(
                                        photo.getOriginalFilename()
                                )
                                .orElse("photo.jpg");

                String extension = ".jpg";

                if (originalName.contains(".")) {

                    String detected =
                            originalName.substring(
                                    originalName.lastIndexOf(".")
                            );

                    detected = detected
                            .replaceAll(
                                    "[^A-Za-z0-9.]",
                                    ""
                            );

                    if (!detected.isBlank() &&
                            detected.length() <= 10) {

                        extension = detected;
                    }
                }

                String filename =
                        UUID.randomUUID() +
                        extension;

                Path destination =
                        uploadDir
                                .resolve(filename)
                                .normalize();

                if (!destination.startsWith(uploadDir)) {

                    return ResponseEntity
                            .badRequest()
                            .body(
                                    Map.of(
                                            "message",
                                            "Invalid file path"
                                    )
                            );
                }

                Files.copy(
                        photo.getInputStream(),
                        destination,
                        StandardCopyOption.REPLACE_EXISTING
                );

                photoUrl =
                        "/uploads/" + filename;
            }

            // ----------------------------------------------------
            // CREATE REPORT
            // ----------------------------------------------------

            IssueReport report =
                    new IssueReport();

            report.setUserId(
                    session.getUserId()
            );

            report.setIssueType(
                    issueType.trim()
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

            report.setReportedAt(
                    LocalDateTime.now()
            );

            report.setUpdatedAt(
                    LocalDateTime.now()
            );

            IssueReport saved =
                    reports.save(report);

            return ResponseEntity.ok(saved);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(401)
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );

        } catch (IOException e) {

            System.err.println(
                    "Unable to save uploaded photo: "
                            + e.getMessage()
            );

            return ResponseEntity
                    .status(500)
                    .body(
                            Map.of(
                                    "message",
                                    "Unable to save uploaded photo"
                            )
                    );

        } catch (Exception e) {

            System.err.println(
                    "Unable to create report: "
                            + (e.getMessage() == null
                                    ? "Unknown server error"
                                    : e.getMessage())
            );

            return ResponseEntity
                    .status(500)
                    .body(
                            Map.of(
                                    "message",
                                    "Unable to create report",
                                    "error",
                                    e.getMessage() == null
                                            ? "Unknown server error"
                                            : e.getMessage()
                            )
                    );
        }
    }


    // ============================================================
    // USER'S REPORTS
    // GET /api/reports/mine
    // ============================================================

    @GetMapping("/mine")
    public ResponseEntity<?> getMyReports(

            @RequestHeader(
                    value = "X-Session-Token",
                    required = false
            )
            String token

    ) {

        try {

            SessionToken session =
                    auth.require(token, "USER");

            List<IssueReport> result =
                    reports.findByUserIdOrderByReportedAtDesc(
                            session.getUserId()
                    );

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(401)
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );

        } catch (Exception e) {

            return ResponseEntity
                    .status(500)
                    .body(
                            Map.of(
                                    "message",
                                    "Unable to load your reports"
                            )
                    );
        }
    }


    // ============================================================
    // ADMIN - ALL REPORTS
    // GET /api/reports
    // ============================================================

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

            return ResponseEntity.ok(
                    reports.findAllByOrderByReportedAtDesc()
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(401)
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );

        } catch (Exception e) {

            org.slf4j.LoggerFactory
                    .getLogger(ReportController.class)
                    .error("Unable to load reports", e);

            return ResponseEntity
                    .status(500)
                    .body(
                            Map.of(
                                    "message",
                                    "Unable to load reports"
                            )
                    );
        }
    }


    // ============================================================
    // ADMIN - UPDATE REPORT STATUS
    // PATCH /api/reports/{id}/status
    // ============================================================

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(

            @RequestHeader(
                    value = "X-Session-Token",
                    required = false
            )
            String token,

            @PathVariable Long id,

            @RequestBody
            Map<String, String> body

    ) {

        try {

            auth.require(token, "ADMIN");

            IssueReport report =
                    reports.findById(id)
                            .orElseThrow(
                                    () ->
                                            new IllegalArgumentException(
                                                    "Report not found"
                                            )
                            );

            String value =
                    body.getOrDefault(
                            "status",
                            ""
                    );

            if (value.isBlank()) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                Map.of(
                                        "message",
                                        "Status is required"
                                )
                        );
            }

            ReportStatus status;

            try {

                status =
                        ReportStatus.valueOf(
                                value.toUpperCase()
                        );

            } catch (IllegalArgumentException e) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                Map.of(
                                        "message",
                                        "Invalid report status"
                                )
                        );
            }

            report.setStatus(status);

            report.setUpdatedAt(
                    LocalDateTime.now()
            );

            return ResponseEntity.ok(
                    reports.save(report)
            );

        } catch (IllegalArgumentException e) {

            if ("Report not found".equals(
                    e.getMessage()
            )) {

                return ResponseEntity
                        .status(404)
                        .body(
                                Map.of(
                                        "message",
                                        "Report not found"
                                )
                        );
            }

            return ResponseEntity
                    .status(401)
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );

        } catch (Exception e) {

            org.slf4j.LoggerFactory
                    .getLogger(ReportController.class)
                    .error("Unable to update report", e);

            return ResponseEntity
                    .status(500)
                    .body(
                            Map.of(
                                    "message",
                                    "Unable to update report"
                            )
                    );
        }
    }
}