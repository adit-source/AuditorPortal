import React from "react";
import {
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Package,
  RefreshCw,
  Inbox,
  ArrowRight
} from "lucide-react";

export default function PodDashboardHeader({
  title = "Audit Operations & Field Surveillance Console",
  subtitle = "Real-time TCPL store audit verification, GPS attendance and stock ledgers",
  primaryBtnText = "Sync Records",
  onPrimaryClick,
  secondaryBtnText = "Pending Audits",
  secondaryBadge = "0",
  onSecondaryClick,
  kpiData = {}
}) {
  const totalAudits = kpiData.totalAudits ?? "0";
  const pendingAudits = kpiData.pendingAudits ?? "0";
  const approvedAudits = kpiData.approvedAudits ?? "0";
  const totalAuditors = kpiData.totalAuditors ?? "0";
  const totalCartons = kpiData.totalCartons ?? "0";
  const totalDiscrepancies = kpiData.totalDiscrepancies ?? "0";

  return (
    <div className="pod-header-and-stats-wrapper" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 1. Deep Forest Green Hero Banner Card */}
      <div className="pod-hero-banner">
        <div className="pod-hero-left">
          <div className="pod-hero-title-row">
            <span className="pod-hero-dot" />
            <h2 className="pod-hero-title">{title}</h2>
          </div>
          <span className="pod-hero-sub">{subtitle}</span>
        </div>

        <div className="pod-hero-actions">
          <button
            type="button"
            className="pod-btn-primary"
            onClick={onPrimaryClick}
            title="Fetch fresh data from database"
          >
            <RefreshCw size={15} />
            <span>{primaryBtnText}</span>
          </button>

          <button
            type="button"
            className="pod-btn-secondary"
            onClick={onSecondaryClick}
            title="View audits waiting for admin review"
          >
            <CheckCircle2 size={15} />
            <span>{secondaryBtnText}</span>
            {secondaryBadge && secondaryBadge !== "0" && (
              <span className="pod-counter-badge">{secondaryBadge}</span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Row of 6 KPI Stat Cards tailored strictly to Audit Operations */}
      <div className="pod-kpi-grid">
        {/* Card 1: Total Audits */}
        <div className="pod-kpi-card kpi-blue">
          <div className="pod-kpi-header">
            <span className="pod-kpi-title">TOTAL AUDITS</span>
            <span className="pod-kpi-icon" style={{ color: "#2563eb" }}>
              <FileSpreadsheet size={16} />
            </span>
          </div>
          <div className="pod-kpi-value">{totalAudits}</div>
          <div className="pod-kpi-footer">
            <span>Submitted Audits</span>
            <span className="pod-kpi-tag green">VERIFIED</span>
          </div>
        </div>

        {/* Card 2: Pending Review */}
        <div className="pod-kpi-card kpi-orange">
          <div className="pod-kpi-header">
            <span className="pod-kpi-title">PENDING REVIEW</span>
            <span className="pod-kpi-icon" style={{ color: "#ea580c" }}>
              <Clock size={16} />
            </span>
          </div>
          <div className="pod-kpi-value" style={{ color: parseInt(pendingAudits) > 0 ? "#c2410c" : "#0f172a" }}>
            {pendingAudits}
          </div>
          <div className="pod-kpi-footer">
            <span>Awaiting Sign-off</span>
            {parseInt(pendingAudits) > 0 && <span className="pod-kpi-tag amber">ACTION NEEDED</span>}
          </div>
        </div>

        {/* Card 3: Approved Audits */}
        <div className="pod-kpi-card kpi-green">
          <div className="pod-kpi-header">
            <span className="pod-kpi-title">APPROVED AUDITS</span>
            <span className="pod-kpi-icon" style={{ color: "#16a34a" }}>
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="pod-kpi-value">{approvedAudits}</div>
          <div className="pod-kpi-footer">
            <span>Audited & Signed</span>
            <span className="pod-kpi-tag green">100% OK</span>
          </div>
        </div>

        {/* Card 4: Field Auditors */}
        <div className="pod-kpi-card kpi-amber">
          <div className="pod-kpi-header">
            <span className="pod-kpi-title">FIELD AUDITORS</span>
            <span className="pod-kpi-icon" style={{ color: "#d97706" }}>
              <Users size={16} />
            </span>
          </div>
          <div className="pod-kpi-value">{totalAuditors}</div>
          <div className="pod-kpi-footer">
            <span>Active Network</span>
            <span className="pod-kpi-tag green">GPS ON</span>
          </div>
        </div>

        {/* Card 5: Stock Discrepancies */}
        <div className="pod-kpi-card kpi-red">
          <div className="pod-kpi-header">
            <span className="pod-kpi-title">DISCREPANCIES</span>
            <span className="pod-kpi-icon" style={{ color: "#dc2626" }}>
              <AlertTriangle size={16} />
            </span>
          </div>
          <div className="pod-kpi-value" style={{ color: parseInt(totalDiscrepancies) > 0 ? "#b91c1c" : "#0f172a" }}>
            {totalDiscrepancies}
          </div>
          <div className="pod-kpi-footer">
            <span>Stock Variances</span>
            {parseInt(totalDiscrepancies) > 0 && <span className="pod-kpi-tag amber">FLAGGED</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
