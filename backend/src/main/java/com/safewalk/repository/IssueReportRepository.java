package com.safewalk.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.safewalk.model.IssueReport;

public interface IssueReportRepository extends JpaRepository<IssueReport, Long> {

    List<IssueReport> findByUserIdOrderByReportedAtDesc(Long userId);

    List<IssueReport> findAllByOrderByReportedAtDesc();
}