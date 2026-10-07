package com.safewalk.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.safewalk.model.IssueReport;
import com.safewalk.model.ReportStatus;
import com.safewalk.repository.IssueReportRepository;
import com.safewalk.service.AuthService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final IssueReportRepository reports;
    private final AuthService auth;

    public AdminController(
            IssueReportRepository reports,
            AuthService auth
    ) {
        this.reports = reports;
        this.auth = auth;
    }

    // ============================================================
    // ADMIN DASHBOARD STATS
    // GET /api/admin/stats
    // ============================================================

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(
            @RequestHeader(
                    value = "X-Session-Token",
                    required = false
            ) String token
    ) {

        try {

            auth.require(token, "ADMIN");

            List<IssueReport> allReports =
                    reports.findAllByOrderByReportedAtDesc();

            long total = allReports.size();

            long open = allReports.stream()
                    .filter(r -> r.getStatus() == ReportStatus.OPEN)
                    .count();

            long inProgress = allReports.stream()
                    .filter(r -> r.getStatus() == ReportStatus.IN_PROGRESS)
                    .count();

            long resolved = allReports.stream()
                    .filter(r -> r.getStatus() == ReportStatus.RESOLVED)
                    .count();

            long rejected = allReports.stream()
                    .filter(r -> r.getStatus() == ReportStatus.REJECTED)
                    .count();

            Map<String, Object> response = new HashMap<>();

            response.put("total", total);
            response.put("open", open);
            response.put("inProgress", inProgress);
            response.put("resolved", resolved);
            response.put("rejected", rejected);

            // Include all reports so the frontend can display
            // location, photo, description and status.
            response.put("reports", allReports);

            return ResponseEntity.ok(response);

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
                    .internalServerError()
                    .body(
                            Map.of(
                                    "message",
                                    "Unable to load admin statistics"
                            )
                    );
        }
    }


    // ============================================================
    // ADMIN ALL REPORTS
    // GET /api/admin/reports
    // ============================================================

    @GetMapping("/reports")
    public ResponseEntity<?> getReports(
            @RequestHeader(
                    value = "X-Session-Token",
                    required = false
            ) String token
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

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "message",
                                    "Unable to load reports"
                            )
                    );
        }
    }
}