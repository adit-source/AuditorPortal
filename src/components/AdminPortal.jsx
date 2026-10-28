import React, { useState, useEffect } from "react";
import trcLogo from "../assets/trc-logo-dark.png";
import PodLayout from "./PodLayout";
import PodDashboardHeader from "./PodDashboardHeader";
import { API_BASE_URL } from "../config";
import {
  Users,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Filter,
  Download,
  Eye,
  Check,
  X,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Package,
  Calendar,
  Layers,
  LocateFixed,
  Camera,
  Trash2,
  Edit3,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  ArrowLeft
} from "lucide-react";

const INDIAN_STATES = [
  "ALL",
  "All States (National)",
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi NCR",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

export default function AdminPortal({ currentUser, onLogout, onSwitchToAuditor }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "auditors" | "audits" | "attendance"
  const [activeNav, setActiveNav] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Overview stats
  const [stats, setStats] = useState({
    totalAuditors: 0,
    verifiedGpsAuditors: 0,
    totalAudits: 0,
    activeAudits: 0,
    completedAudits: 0,
    totalCartons: 0,
    totalDiscrepancies: 0,
  });
  const [recentAuditors, setRecentAuditors] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);

  // Auditors management
  const [auditors, setAuditors] = useState([]);
  const [auditorSearch, setAuditorSearch] = useState("");
  const [selectedStateFilter, setSelectedStateFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Audits review
  const [audits, setAudits] = useState([]);
  const [auditStatusFilter, setAuditStatusFilter] = useState("ALL");

  // Attendance punch logs
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  // Modals & previews
  const [selectedAuditor, setSelectedAuditor] = useState(null);
  const [selectedAuditForReview, setSelectedAuditForReview] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reviewingStatus, setReviewingStatus] = useState("APPROVED");
  const [previewImage, setPreviewImage] = useState(null); // { url, title, gps, time }
  const [editStateModalAuditor, setEditStateModalAuditor] = useState(null);
  const [newStateVal, setNewStateVal] = useState("Maharashtra");

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const getTimeGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 4 && hours < 12) return { text: "Good Morning", icon: "🌅" };
    if (hours >= 12 && hours < 17) return { text: "Good Afternoon", icon: "☀️" };
    if (hours >= 17 && hours < 22) return { text: "Good Evening", icon: "🌆" };
    return { text: "Good Evening", icon: "🌙" };
  };
  const greeting = getTimeGreeting();

  // Fetch Overview Data
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/overview`);
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
          setRecentAuditors(data.recentAuditors || []);
          setRecentAudits(data.recentAudits || []);
        }
      } catch (err) {
        console.error("Overview error:", err);
      }
    };
    fetchOverview();
  }, [refreshKey]);

  // Fetch Auditors List
  useEffect(() => {
    if (activeTab !== "auditors" && activeTab !== "overview") return;
    const fetchAuditors = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (auditorSearch) params.append("search", auditorSearch);
        if (selectedStateFilter !== "ALL") params.append("state", selectedStateFilter);
        if (selectedStatusFilter !== "ALL") params.append("status", selectedStatusFilter);

        const res = await fetch(`${API_BASE_URL}/admin/auditors?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setAuditors(data.auditors || []);
        }
      } catch (err) {
        console.error("Auditors fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditors();
  }, [activeTab, auditorSearch, selectedStateFilter, selectedStatusFilter, refreshKey]);

  // Fetch Audits List
  useEffect(() => {
    if (activeTab !== "audits") return;
    const fetchAudits = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (auditStatusFilter !== "ALL") params.append("status", auditStatusFilter);
        const res = await fetch(`${API_BASE_URL}/tcpl/audits?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setAudits(data.audits || []);
        }
      } catch (err) {
        console.error("Audits fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, [activeTab, auditStatusFilter, refreshKey]);

  // Fetch Attendance Logs
  useEffect(() => {
    if (activeTab !== "attendance") return;
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/attendance`);
        const data = await res.json();
        if (data.success) {
          setAttendanceLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Attendance fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [activeTab, refreshKey]);

  // Auditor Status Update handler (approved, pending, suspended)
  const handleUpdateAuditorStatus = async (auditorId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auditors/${auditorId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Auditor status updated to ${newStatus.toUpperCase()}`);
        setRefreshKey(prev => prev + 1);
        if (selectedAuditor && selectedAuditor.id === auditorId) {
          setSelectedAuditor(prev => ({ ...prev, account_status: newStatus }));
        }
      } else {
        showToast("error", data.message || "Failed to update auditor status");
      }
    } catch {
      showToast("error", "Network error updating auditor status");
    }
  };

  // Auditor State Assignment Update handler
  const handleUpdateAuditorState = async () => {
    if (!editStateModalAuditor) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auditors/${editStateModalAuditor.id}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_state: newStateVal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Assigned state updated to ${newStateVal}`);
        setEditStateModalAuditor(null);
        setRefreshKey(prev => prev + 1);
      } else {
        showToast("error", data.message || "Failed to update state");
      }
    } catch {
      showToast("error", "Network error updating state");
    }
  };

  // Delete Auditor
  const handleDeleteAuditor = async (auditorId, auditorName) => {
    if (!window.confirm(`Are you sure you want to remove auditor ${auditorName}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auditors/${auditorId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Auditor account removed");
        if (selectedAuditor?.id === auditorId) setSelectedAuditor(null);
        setRefreshKey(prev => prev + 1);
      } else {
        showToast("error", data.message || "Failed to remove auditor");
      }
    } catch {
      showToast("error", "Network error removing auditor");
    }
  };

  // Delete Audit Submission (Permanent Remove)
  const handleDeleteAudit = async (auditId, siteName = "TCPL Facility") => {
    const shortId = auditId?.substring ? auditId.substring(0, 8) : auditId;
    if (!window.confirm(`Are you sure you want to permanently remove Audit #${shortId} (${siteName})?\n\nThis will remove the entry/exit selfies and complete audit record.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/audits/${auditId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Audit #${shortId} removed successfully`);
        if (selectedAuditForReview?.id === auditId) {
          setSelectedAuditForReview(null);
        }
        setRefreshKey(prev => prev + 1);
      } else {
        showToast("error", data.message || "Failed to remove audit submission");
      }
    } catch {
      showToast("error", "Network error removing audit submission");
    }
  };

  // Submit Audit Review (Approve / Reject)
  const handleSubmitAuditReview = async () => {
    if (!selectedAuditForReview) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/audits/${selectedAuditForReview.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewingStatus,
          remarks: reviewRemarks || `Audit ${reviewingStatus.toLowerCase()} by HQ Admin`
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const shortId = selectedAuditForReview.id?.substring ? selectedAuditForReview.id.substring(0, 8) : selectedAuditForReview.id;
        showToast("success", `Audit #${shortId} marked as ${reviewingStatus}`);
        setSelectedAuditForReview(null);
        setReviewRemarks("");
        setRefreshKey(prev => prev + 1);
      } else {
        showToast("error", data.message || "Failed to review audit");
      }
    } catch {
      showToast("error", "Network error during review");
    }
  };

  // Helper: Download Base64 Excel Sheet
  const handleDownloadExcel = (audit) => {
    if (!audit.excel_file_data) {
      showToast("error", "No Excel file data attached to this audit.");
      return;
    }
    const link = document.createElement("a");
    link.href = audit.excel_file_data;
    link.download = audit.excel_file_name || `tcpl_audit_${audit.id}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", `Downloaded: ${link.download}`);
  };

  // Helper: Download Base64 Photo (Login Entry / Logout Exit Selfie)
  const handleDownloadPhoto = (photoDataUrl, defaultFilename) => {
    if (!photoDataUrl) {
      showToast("error", "No photo available to download.");
      return;
    }
    try {
      const link = document.createElement("a");
      link.href = photoDataUrl;
      link.download = defaultFilename || `TCPL_Audit_Selfie_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("success", `Photo downloaded: ${link.download}`);
    } catch (err) {
      console.error("Photo download error:", err);
      showToast("error", "Failed to download photo file.");
    }
  };

  return (
    <PodLayout
      currentUser={currentUser}
      roleBadge="ADM"
      activeNav={activeNav}
      onNavChange={(navKey) => {
        setActiveNav(navKey);
        if (navKey === "dashboard") setActiveTab("overview");
        else if (navKey === "users") setActiveTab("auditors");
        else if (navKey === "documents" || navKey === "review") setActiveTab("audits");
        else if (navKey === "logs") setActiveTab("attendance");
        else setActiveTab(navKey);
      }}
      onLogout={onLogout}
      onSwitchRole={onSwitchToAuditor}
      switchRoleLabel="Auditor Portal"
      reviewQueueBadge={String(stats.totalAudits - stats.completedAudits > 0 ? stats.totalAudits - stats.completedAudits : 0)}
      title="TRC Consulting — Audit Operations Portal"
    >
      {/* Toast Alert */}
      {toast && (
        <div className={`landing-toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Viewport Content Area */}
      <div className="admin-main-viewport" style={{ width: "100%" }}>
        <div className="admin-main-container" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* =========================================================
            TAB 1: DASHBOARD OVERVIEW
        ========================================================= */}
        {activeTab === "overview" && (
          <div className="admin-overview-view" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* The signature Hero Banner and 6 KPI cards */}
            <PodDashboardHeader
              title="Audit Operations & Surveillance Intelligence"
              subtitle={`${stats.totalAudits || 0} field audits submitted • ${stats.totalAuditors || 0} registered auditors • ${stats.totalDiscrepancies || 0} discrepancies flagged`}
              primaryBtnText="Sync Records"
              onPrimaryClick={() => {
                setRefreshKey(prev => prev + 1);
                showToast("success", "Syncing all records from database...");
              }}
              secondaryBtnText="Review Audits"
              secondaryBadge={String(stats.totalAudits - stats.completedAudits > 0 ? stats.totalAudits - stats.completedAudits : 0)}
              onSecondaryClick={() => {
                setActiveNav("documents");
                setActiveTab("audits");
              }}
              kpiData={{
                totalAudits: String(stats.totalAudits ?? 0),
                pendingAudits: String(stats.totalAudits - stats.completedAudits > 0 ? stats.totalAudits - stats.completedAudits : 0),
                approvedAudits: String(stats.completedAudits ?? 0),
                totalAuditors: String(stats.totalAuditors ?? 0),
                totalCartons: String(stats.totalCartons ?? 0),
                totalDiscrepancies: String(stats.totalDiscrepancies ?? 0)
              }}
            />

            {/* Split Grids: Recent Auditors & Recent Audits */}
            <div className="admin-overview-columns">
              {/* Left Column: Recent Registered Auditors */}
              <div className="admin-panel-card">
                <div className="panel-card-header">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-emerald-400" />
                    <h3>Recently Registered Auditors</h3>
                  </div>
                  <button
                    type="button"
                    className="btn-view-all"
                    onClick={() => {
                      setActiveTab("auditors");
                      setActiveNav("users");
                    }}
                  >
                    View All Auditors →
                  </button>
                </div>

                <div className="auditors-mini-list">
                  {recentAuditors.length === 0 ? (
                    <div className="empty-state-card">No auditors registered yet.</div>
                  ) : (
                    recentAuditors.map((aud) => (
                      <div key={aud.id} className="auditor-mini-item">
                        <div className="auditor-avatar-mini">
                          {aud.full_name?.substring(0, 2).toUpperCase() || "AU"}
                        </div>
                        <div className="auditor-mini-info">
                          <div className="auditor-header-line">
                            <span className="auditor-name-text">{aud.full_name}</span>
                            <span className="auditor-code-badge">
                              {aud.employee_code || "AUD"}
                            </span>
                            <span
                              className={`status-chip ${
                                aud.account_status === "approved" || aud.account_status === "active"
                                  ? "approved"
                                  : aud.account_status === "suspended"
                                  ? "suspended"
                                  : "pending"
                              }`}
                            >
                              <span className="chip-dot" />
                              {aud.account_status || "pending"}
                            </span>
                          </div>
                          <div className="auditor-meta-sub">
                            <span className="auditor-state-tag">📍 {aud.assigned_state || "Maharashtra"}</span>
                            {aud.signup_location && (
                              <>
                                <span className="dot-sep">•</span>
                                <span className="auditor-gps-tag truncate max-w-[220px]" title={aud.signup_location}>
                                  GPS: {aud.signup_location}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn-action-small"
                          onClick={() => {
                            setSelectedAuditor(aud);
                            setActiveTab("auditors");
                          }}
                        >
                          Review
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Recent Audits & Work Sheets */}
              <div className="admin-panel-card">
                <div className="panel-card-header">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-emerald-400" />
                    <h3>Recent Field Audit Submissions</h3>
                  </div>
                  <button
                    type="button"
                    className="btn-view-all"
                    onClick={() => {
                      setActiveTab("audits");
                      setActiveNav("documents");
                    }}
                  >
                    View All Audits →
                  </button>
                </div>

                <div className="audits-mini-list">
                  {recentAudits.length === 0 ? (
                    <div className="empty-state-card">No audits submitted yet.</div>
                  ) : (
                    recentAudits.map((audit) => (
                      <div key={audit.id} className="audit-mini-item">
                        {/* Audit Header with clean truncated ID, Status Chip & Delete Option */}
                        <div className="audit-mini-header">
                          <div className="audit-title-block">
                            <span className="audit-id-badge">#{audit.id.substring(0, 8)}</span>
                            <span className="audit-facility-name" title={audit.tcpl_site}>
                              {audit.tcpl_site}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`status-chip ${audit.audit_status?.toLowerCase() || "submitted"}`}>
                              <span className="chip-dot" />
                              {audit.audit_status}
                            </span>
                            <button
                              type="button"
                              className="btn-action-icon text-red-400 hover:text-red-300 hover:bg-red-500/15"
                              onClick={() => handleDeleteAudit(audit.id, audit.tcpl_site)}
                              title="Delete Audit Submission"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Audit Sub-details */}
                        <div className="audit-mini-details">
                          <span className="detail-item">👤 {audit.auditor_name} ({audit.employee_code})</span>
                          <span className="dot-sep">•</span>
                          <span className="detail-item">📦 {audit.total_items || 0} Units</span>
                          <span className="dot-sep">•</span>
                          <span className={`detail-item ${audit.discrepancy_count > 0 ? "text-amber-400 font-semibold" : "text-emerald-400"}`}>
                            ⚠️ {audit.discrepancy_count || 0} Issues
                          </span>
                        </div>

                        {/* Dual Photo Punch Slots: Login/Entry and Logout/Exit with 1-click Download */}
                        <div className="audit-mini-selfies-row">
                          {/* 1. Login / Entry Punch Selfie */}
                          <div className="selfie-card-slot">
                            <div className="selfie-slot-header">
                              <span className="selfie-slot-tag entry">
                                <Camera size={11} />
                                <span>Entry Punch</span>
                              </span>
                              {audit.login_selfie && (
                                <button
                                  type="button"
                                  className="btn-mini-save-icon"
                                  title="Download Entry Selfie"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadPhoto(
                                      audit.login_selfie,
                                      `TCPL_Login_Selfie_${audit.employee_code}_${audit.id.substring(0, 8)}.jpg`
                                    );
                                  }}
                                >
                                  <Download size={11} />
                                  <span>Save</span>
                                </button>
                              )}
                            </div>

                            {audit.login_selfie ? (
                              <div
                                className="selfie-thumb-wrap"
                                onClick={() =>
                                  setPreviewImage({
                                    url: audit.login_selfie,
                                    title: `Login / Entry Punch Selfie - ${audit.auditor_name} (${audit.employee_code})`,
                                    gps: audit.login_gps,
                                    time: audit.created_at,
                                    filename: `TCPL_Login_Selfie_${audit.employee_code}_${audit.id.substring(0, 8)}.jpg`
                                  })
                                }
                              >
                                <img src={audit.login_selfie} alt="Login Entry Punch" />
                                <div className="selfie-overlay-pill">
                                  <Eye size={10} />
                                  <span>Click to Enlarge</span>
                                </div>
                              </div>
                            ) : (
                              <div className="no-selfie-box-mini">
                                <span>No Entry Photo Recorded</span>
                              </div>
                            )}
                          </div>

                          {/* 2. Logout / Exit Punch Selfie */}
                          <div className="selfie-card-slot">
                            <div className="selfie-slot-header">
                              <span className="selfie-slot-tag exit">
                                <Camera size={11} />
                                <span>Exit Punch</span>
                              </span>
                              {audit.exit_selfie && (
                                <button
                                  type="button"
                                  className="btn-mini-save-icon"
                                  title="Download Exit Selfie"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadPhoto(
                                      audit.exit_selfie,
                                      `TCPL_Logout_Selfie_${audit.employee_code}_${audit.id.substring(0, 8)}.jpg`
                                    );
                                  }}
                                >
                                  <Download size={11} />
                                  <span>Save</span>
                                </button>
                              )}
                            </div>

                            {audit.exit_selfie ? (
                              <div
                                className="selfie-thumb-wrap"
                                onClick={() =>
                                  setPreviewImage({
                                    url: audit.exit_selfie,
                                    title: `Logout / Exit Punch Selfie - ${audit.auditor_name} (${audit.employee_code})`,
                                    gps: audit.exit_gps,
                                    time: audit.exit_time,
                                    filename: `TCPL_Logout_Selfie_${audit.employee_code}_${audit.id.substring(0, 8)}.jpg`
                                  })
                                }
                              >
                                <img src={audit.exit_selfie} alt="Logout Exit Punch" />
                                <div className="selfie-overlay-pill">
                                  <Eye size={10} />
                                  <span>Click to Enlarge</span>
                                </div>
                              </div>
                            ) : (
                              <div className="no-selfie-box-mini">
                                <span>Pending Shift Logout</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Excel Sheet Download & Review Button */}
                        <div className="audit-mini-actions">
                          {audit.excel_file_data ? (
                            <button
                              type="button"
                              className="btn-download-mini"
                              onClick={() => handleDownloadExcel(audit)}
                            >
                              <FileSpreadsheet size={12} />
                              <span className="truncate max-w-[190px]">{audit.excel_file_name || "Download Audit Sheet.xlsx"}</span>
                              <Download size={11} className="ml-1 opacity-70" />
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">No Excel sheet attached</span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="btn-review-mini"
                              onClick={() => {
                                setSelectedAuditForReview(audit);
                                setReviewingStatus(audit.audit_status === "SUBMITTED" ? "APPROVED" : audit.audit_status);
                                setReviewRemarks(audit.admin_remarks || "");
                              }}
                            >
                              Review & Verify
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: AUDITORS MANAGEMENT & REVIEW
        ========================================================= */}
        {activeTab === "auditors" && (
          <div className="admin-auditors-view">
            {/* Top Navigation Back Bar */}
            <div className="admin-view-header-strip">
              <button
                type="button"
                className="btn-back-breadcrumb"
                onClick={() => {
                  setActiveTab("overview");
                  setActiveNav("dashboard");
                }}
                title="Return to Dashboard Overview"
              >
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </button>
              <div className="view-header-badge">
                <Users size={15} />
                <span>Auditors Management & State Allocation</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="admin-filter-bar">
              <div className="search-box">
                <Search size={15} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Name, Employee Code, or Email..."
                  value={auditorSearch}
                  onChange={(e) => setAuditorSearch(e.target.value)}
                />
                {auditorSearch && (
                  <button type="button" onClick={() => setAuditorSearch("")} className="btn-clear-search">
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-selects-group">
                <div className="filter-select-wrap">
                  <MapPin size={13} className="text-slate-400" />
                  <select
                    value={selectedStateFilter}
                    onChange={(e) => setSelectedStateFilter(e.target.value)}
                  >
                    <option value="ALL">All States</option>
                    {INDIAN_STATES.filter(s => s !== "ALL").map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-select-wrap">
                  <Filter size={13} className="text-slate-400" />
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="approved">Approved / Active</option>
                    <option value="pending">Pending Verification</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Auditors Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Auditor Profile</th>
                    <th>Code</th>
                    <th>Audit State</th>
                    <th>Sign-up GPS Verification</th>
                    <th>Total Audits</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auditors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No auditors match your search filters.
                      </td>
                    </tr>
                  ) : (
                    auditors.map((aud) => {
                      const isApproved = aud.account_status === "approved" || aud.account_status === "active";
                      const isSuspended = aud.account_status === "suspended";

                      return (
                        <tr key={aud.id} className="admin-table-row">
                          <td>
                            <div className="auditor-profile-cell">
                              <div className="auditor-avatar-circle">
                                {aud.full_name?.substring(0, 2).toUpperCase() || "AU"}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-100">{aud.full_name}</div>
                                <div className="text-xs text-slate-400">{aud.email}</div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="font-mono text-xs font-bold text-emerald-700 whitespace-nowrap" style={{ whiteSpace: "nowrap" }}>
                              {aud.employee_code || "AUD-101"}
                            </span>
                          </td>

                          <td>
                            <div className="flex items-center gap-1.5 whitespace-nowrap" style={{ whiteSpace: "nowrap" }}>
                              <span className="text-xs text-slate-800 font-semibold">{aud.assigned_state || "Maharashtra"}</span>
                              <button
                                type="button"
                                className="btn-edit-icon"
                                title="Change Assigned State"
                                onClick={() => {
                                  setEditStateModalAuditor(aud);
                                  setNewStateVal(aud.assigned_state || "Maharashtra");
                                }}
                              >
                                <Edit3 size={11} />
                              </button>
                            </div>
                          </td>

                          <td>
                            {aud.signup_lat && aud.signup_lng ? (
                              <div className="gps-table-cell">
                                <a
                                  href={`https://maps.google.com/?q=${aud.signup_lat},${aud.signup_lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="gps-link"
                                  title="View on Google Maps"
                                >
                                  <LocateFixed size={12} className="text-emerald-700 shrink-0" />
                                  <span className="gps-text truncate max-w-[150px]">
                                    {aud.signup_location || `${aud.signup_lat}, ${aud.signup_lng}`}
                                  </span>
                                  <ExternalLink size={10} className="text-slate-500 shrink-0" />
                                </a>
                                <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                  {Number(aud.signup_lat).toFixed(4)}, {Number(aud.signup_lng).toFixed(4)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic whitespace-nowrap">No GPS recorded</span>
                            )}
                          </td>

                          <td>
                            <div className="text-xs whitespace-nowrap" style={{ whiteSpace: "nowrap" }}>
                              <strong className="text-slate-900 font-bold">{aud.total_audits || 0}</strong> audits
                              {aud.total_cartons > 0 && (
                                <span className="block text-[11px] text-slate-500">
                                  {Number(aud.total_cartons).toLocaleString()} units
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <span
                              className={`status-chip ${
                                isApproved ? "approved" : isSuspended ? "suspended" : "pending"
                              }`}
                              style={{ whiteSpace: "nowrap" }}
                            >
                              {aud.account_status || "pending"}
                            </span>
                          </td>

                          <td>
                            <div className="table-actions-cell">
                              {/* Primary Status Toggle Pill */}
                              {isApproved ? (
                                <button
                                  type="button"
                                  className="btn-action-pill suspend"
                                  onClick={() => handleUpdateAuditorStatus(aud.id, "suspended")}
                                  title="Suspend Auditor Access"
                                >
                                  <X size={12} />
                                  <span>Suspend</span>
                                </button>
                              ) : isSuspended ? (
                                <button
                                  type="button"
                                  className="btn-action-pill activate"
                                  onClick={() => handleUpdateAuditorStatus(aud.id, "approved")}
                                  title="Reactivate Auditor"
                                >
                                  <Check size={12} />
                                  <span>Reactivate</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-action-pill approve"
                                  onClick={() => handleUpdateAuditorStatus(aud.id, "approved")}
                                  title="Approve Auditor Account"
                                >
                                  <Check size={12} />
                                  <span>Approve</span>
                                </button>
                              )}

                              {/* View Details */}
                              <button
                                type="button"
                                className="btn-action-icon inspect"
                                onClick={() => setSelectedAuditor(aud)}
                                title="Inspect Auditor Details"
                              >
                                <Eye size={13} />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                className="btn-action-icon delete"
                                onClick={() => handleDeleteAuditor(aud.id, aud.full_name)}
                                title="Delete Auditor Account"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: AUDIT SUBMISSIONS & WORK SHEET REVIEW
        ========================================================= */}
        {activeTab === "audits" && (
          <div className="admin-audits-view">
            {/* Top Navigation Back Bar */}
            <div className="admin-view-header-strip">
              <button
                type="button"
                className="btn-back-breadcrumb"
                onClick={() => {
                  setActiveTab("overview");
                  setActiveNav("dashboard");
                }}
                title="Return to Dashboard Overview"
              >
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </button>
              <div className="view-header-badge">
                <FileSpreadsheet size={15} />
                <span>Field Audit Submissions & Photo Punches</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="admin-filter-bar">
              <div className="filter-select-wrap">
                <Filter size={13} className="text-slate-400" />
                <select
                  value={auditStatusFilter}
                  onChange={(e) => setAuditStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Audit Statuses</option>
                  <option value="SUBMITTED">Submitted (Pending Review)</option>
                  <option value="IN_PROGRESS">In Progress (Shift Active)</option>
                  <option value="APPROVED">Approved by Admin</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="text-xs text-slate-400">
                Total Submissions: <strong className="text-emerald-400">{audits.length}</strong>
              </div>
            </div>

            {/* Audits Review Cards Grid */}
            <div className="admin-audits-grid">
              {audits.length === 0 ? (
                <div className="empty-state-card col-span-full">No audit submissions match the filter.</div>
              ) : (
                audits.map((audit) => (
                  <div key={audit.id} className="audit-review-card">
                    {/* Top Row: Meta tags on left, status + delete on right */}
                    <div className="audit-card-top-bar">
                      <div className="audit-card-badges">
                        <span className="audit-id-tag">
                          #{audit.id.substring(0, 8)}
                        </span>
                        <span className="audit-state-tag">
                          <MapPin size={11} className="text-emerald-400" />
                          {audit.state}
                        </span>
                        <span className="audit-date-tag">
                          <Calendar size={11} className="text-slate-400" />
                          {new Date(audit.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      <div className="audit-card-actions-quick">
                        <span className={`status-chip ${audit.audit_status?.toLowerCase() || "submitted"}`}>
                          <span className="chip-dot" />
                          {audit.audit_status}
                        </span>
                        <button
                          type="button"
                          className="btn-card-delete-icon"
                          onClick={() => handleDeleteAudit(audit.id, audit.tcpl_site)}
                          title="Delete / Remove Audit Submission"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Site Name - Big, Clear & Dedicated */}
                    <div className="audit-site-header">
                      <h4 className="audit-site-title" title={audit.tcpl_site}>
                        {audit.tcpl_site}
                      </h4>
                    </div>

                    {/* Auditor Info Strip */}
                    <div className="audit-auditor-strip">
                      <div className="auditor-avatar-mini">
                        {audit.auditor_name?.substring(0, 2).toUpperCase() || "AU"}
                      </div>
                      <div className="auditor-details-block">
                        <div className="auditor-name-row">
                          <span className="auditor-name-text">{audit.auditor_name}</span>
                          <span className="auditor-code-tag">{audit.employee_code}</span>
                        </div>
                        <div className="auditor-shift-time">
                          <span className="shift-time-item">
                            <Clock size={11} className="text-emerald-400" />
                            <span>In: {new Date(audit.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                          </span>
                          {audit.exit_time ? (
                            <span className="shift-time-item">
                              <span className="time-sep">•</span>
                              <Clock size={11} className="text-blue-400" />
                              <span>Out: {new Date(audit.exit_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                            </span>
                          ) : (
                            <span className="shift-ongoing-badge">
                              <span className="pulse-dot-amber" />
                              <span>Shift Ongoing</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Selfies Comparison Showcase */}
                    <div className="audit-selfies-deck">
                      {/* Arrival / Entry Punch */}
                      <div className="selfie-slot-card entry-theme">
                        <div className="selfie-slot-header">
                          <div className="selfie-slot-title">
                            <span className="slot-dot entry-dot" />
                            <span>Arrival Punch</span>
                          </div>
                          {audit.login_selfie && (
                            <button
                              type="button"
                              className="btn-selfie-dl"
                              title="Download Entry / Login Photo"
                              onClick={() =>
                                handleDownloadPhoto(
                                  audit.login_selfie,
                                  `TCPL_Login_Selfie_${audit.employee_code}_${audit.id.substring(0, 8)}.jpg`
                                )
                              }
                            >
                              <Download size={11} />
                              <span>Save</span>
                            </button>
                          )}
                        </div>

                        {audit.login_selfie ? (
                          <div
                            className="selfie-slot-media"
                            onClick={() =>
                              setPreviewImage({
                                url: audit.login_selfie,
                                title: `Arrival Punch Selfie - ${audit.auditor_name} at ${audit.tcpl_site}`,
                                gps: audit.login_gps,
                                time: audit.created_at,
                                filename: `TCPL_Login_Selfie_${audit.employee_code}_${audit.id.substring(0, 8)}.jpg`
                              })
                            }
                          >
                            <img src={audit.login_selfie} alt="Arrival Punch Selfie" />
                            <div className="selfie-hover-overlay">
                              <Eye size={12} />
                              <span>Click to enlarge</span>
                            </div>
                          </div>
                        ) : (
                          <div className="selfie-slot-empty">
                            <Camera size={18} className="text-slate-600 mb-1" />
                            <span>No entry selfie</span>
                          </div>
                        )}

                        <div className="selfie-slot-footer" title={audit.login_gps || "GPS Stamped"}>
                          <MapPin size={11} className="text-emerald-400 shrink-0" />
                          <span className="truncate">{audit.login_gps || "GPS Location Stamped"}</span>
                        </div>
                      </div>

                      {/* Departure / Exit Punch */}
                      <div className="selfie-slot-card exit-theme">
                        <div className="selfie-slot-header">
                          <div className="selfie-slot-title">
                            <span className="slot-dot exit-dot" />
                            <span>Departure Punch</span>
                          </div>
                          {audit.exit_selfie && (
                            <button
                              type="button"
                              className="btn-selfie-dl"
                              title="Download Exit / Logout Photo"
                              onClick={() =>
                                handleDownloadPhoto(
                                  audit.exit_selfie,
                                  `TCPL_Logout_Selfie_${audit.employee_code}_${audit.id.substring(0, 8)}.jpg`
                                )
                              }
                            >
                              <Download size={11} />
                              <span>Save</span>
                            </button>
                          )}
                        </div>

                        {audit.exit_selfie ? (
                          <div
                            className="selfie-slot-media"
                            onClick={() =>
                              setPreviewImage({
                                url: audit.exit_selfie,
                                title: `Departure Punch Selfie - ${audit.auditor_name} at ${audit.tcpl_site}`,
                                gps: audit.exit_gps,
                                time: audit.exit_time,
                                filename: `TCPL_Logout_Selfie_${audit.employee_code}_${audit.id.substring(0, 8)}.jpg`
                              })
                            }
                          >
                            <img src={audit.exit_selfie} alt="Departure Punch Selfie" />
                            <div className="selfie-hover-overlay">
                              <Eye size={12} />
                              <span>Click to enlarge</span>
                            </div>
                          </div>
                        ) : (
                          <div className="selfie-slot-pending">
                            <Clock size={20} className="text-amber-400 animate-pulse mb-1.5" />
                            <span className="font-semibold text-amber-300 text-xs">Shift In Progress</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">Awaiting Exit Punch</span>
                          </div>
                        )}

                        <div className="selfie-slot-footer" title={audit.exit_gps || (audit.exit_time ? "GPS Stamped" : "Pending Shift End")}>
                          <MapPin size={11} className={audit.exit_selfie ? "text-blue-400 shrink-0" : "text-amber-400/70 shrink-0"} />
                          <span className="truncate">
                            {audit.exit_gps || (audit.exit_time ? "GPS Location Stamped" : "Pending Shift End")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Inspection Metrics Strip */}
                    <div className="audit-metrics-strip">
                      <div className="metric-strip-card">
                        <span className="metric-strip-label">Cartons Audited</span>
                        <div className="metric-strip-value text-slate-100">
                          <Package size={13} className="text-emerald-400" />
                          <span>{audit.total_items || 0}</span>
                        </div>
                      </div>
                      <div className="metric-strip-card">
                        <span className="metric-strip-label">Discrepancies</span>
                        <div className={`metric-strip-value ${audit.discrepancy_count > 0 ? "text-amber-400 font-bold" : "text-emerald-400"}`}>
                          <AlertTriangle size={13} />
                          <span>{audit.discrepancy_count || 0}</span>
                        </div>
                      </div>
                      <div className="metric-strip-card">
                        <span className="metric-strip-label">Work Sheet</span>
                        <div className="metric-strip-value text-slate-300 text-xs" title={audit.excel_file_name}>
                          <FileSpreadsheet size={13} className="text-emerald-400/80 shrink-0" />
                          <span className="truncate max-w-[90px]">{audit.excel_file_name || "Pending"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Remarks if any */}
                    {audit.remarks && (
                      <div className="audit-remarks-block">
                        <span className="remarks-label">Auditor Remarks:</span>
                        <p className="remarks-text">{audit.remarks}</p>
                      </div>
                    )}

                    {/* Admin remarks if already reviewed */}
                    {audit.admin_remarks && (
                      <div className="audit-admin-notes-block">
                        <span className="admin-notes-label">HQ Admin Notes:</span>
                        <p className="admin-notes-text">{audit.admin_remarks}</p>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="audit-card-footer">
                      {audit.excel_file_data && (
                        <button
                          type="button"
                          className="btn-download-excel"
                          onClick={() => handleDownloadExcel(audit)}
                        >
                          <Download size={13} />
                          <span>Excel ({audit.excel_file_size || "Sheet"})</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-open-review-modal"
                        onClick={() => {
                          setSelectedAuditForReview(audit);
                          setReviewingStatus(audit.audit_status === "SUBMITTED" ? "APPROVED" : audit.audit_status);
                          setReviewRemarks(audit.admin_remarks || "");
                        }}
                      >
                        <ShieldCheck size={14} />
                        <span>Review & Verify</span>
                      </button>

                      <button
                        type="button"
                        className="btn-delete-card-audit"
                        onClick={() => handleDeleteAudit(audit.id, audit.tcpl_site)}
                        title="Delete this audit submission"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: ATTENDANCE PUNCH LOGS
        ========================================================= */}
        {activeTab === "attendance" && (
          <div className="admin-attendance-view">
            {/* Top Navigation Back Bar */}
            <div className="admin-view-header-strip">
              <button
                type="button"
                className="btn-back-breadcrumb"
                onClick={() => {
                  setActiveTab("overview");
                  setActiveNav("dashboard");
                }}
                title="Return to Dashboard Overview"
              >
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </button>
              <div className="view-header-badge">
                <Clock size={15} />
                <span>Attendance Logs & Biometric Verification</span>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Auditor</th>
                    <th>Code</th>
                    <th>Punch Type</th>
                    <th>Timestamp</th>
                    <th>GPS Location Verification</th>
                    <th>Biometric Selfie</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No attendance logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    attendanceLogs.map((log) => (
                      <tr key={log.id} className="admin-table-row">
                        <td>
                          <span className="font-semibold text-slate-100">{log.auditor_name}</span>
                        </td>
                        <td>
                          <span className="font-mono text-xs text-emerald-400">{log.employee_code}</span>
                        </td>
                        <td>
                          <span className={`punch-type-badge ${log.punch_type?.toLowerCase()}`}>
                            {log.punch_type === "IN" ? "🟢 PUNCH IN" : "🔴 PUNCH OUT"}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-300 font-mono">
                            {new Date(log.timestamp).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          <div className="gps-table-cell">
                            <span className="text-xs font-semibold text-white">📍 {log.location_name || "TCPL Verified Site"}</span>
                            <span className="text-[10.5px] text-emerald-400 font-medium">✓ Live Exact Location</span>
                          </div>
                        </td>
                        <td>
                          {log.selfie_data ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                className="selfie-thumb-btn mini"
                                onClick={() =>
                                  setPreviewImage({
                                    url: log.selfie_data,
                                    title: `Punch ${log.punch_type} Selfie - ${log.auditor_name}`,
                                    gps: `${log.gps_lat}, ${log.gps_lng}`,
                                    time: log.timestamp,
                                    filename: `TCPL_Attendance_${log.punch_type}_${log.employee_code}.jpg`
                                  })
                                }
                              >
                                <img src={log.selfie_data} alt="Selfie" />
                                <span className="text-[9px]">VIEW</span>
                              </button>
                              <button
                                type="button"
                                className="btn-table-dl-photo"
                                title="Download Punch Photo"
                                onClick={() =>
                                  handleDownloadPhoto(
                                    log.selfie_data,
                                    `TCPL_Attendance_${log.punch_type}_${log.employee_code}_${Date.now()}.jpg`
                                  )
                                }
                              >
                                <Download size={11} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">No selfie</span>
                          )}
                        </td>
                        <td>
                          <span className="status-chip approved">VERIFIED</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* =========================================================
          MODAL 1: AUDIT REVIEW & APPROVAL MODAL
      ========================================================= */}
      {selectedAuditForReview && (
        <div className="modal-backdrop" onClick={() => setSelectedAuditForReview(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-modal-back-pill"
                  onClick={() => setSelectedAuditForReview(null)}
                  title="Go Back"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={18} className="text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-sm md:text-base">Review Audit #{selectedAuditForReview.id.substring(0, 8)}</h3>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setSelectedAuditForReview(null)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="audit-review-summary-box">
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm">{selectedAuditForReview.tcpl_site}</span>
                  <span className="text-xs font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 shrink-0 font-bold">
                    📍 {selectedAuditForReview.state}
                  </span>
                </div>
                <div className="text-xs text-slate-700">
                  Auditor: <strong className="text-slate-900 font-bold">{selectedAuditForReview.auditor_name}</strong> ({selectedAuditForReview.employee_code})
                </div>
                <div className="text-xs text-slate-700 mt-1">
                  Inspected Cartons: <strong className="text-slate-900 font-bold">{selectedAuditForReview.total_items || 0}</strong> • Discrepancies:{" "}
                  <strong className={selectedAuditForReview.discrepancy_count > 0 ? "text-amber-800 font-bold" : "text-emerald-800 font-bold"}>
                    {selectedAuditForReview.discrepancy_count || 0}
                  </strong>
                </div>
              </div>

              {/* Dual Selfies Comparison Inside Modal */}
              <div className="modal-selfies-preview-grid mt-3">
                <div className="modal-selfie-card">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1 truncate">
                      <Camera size={11} className="shrink-0" />
                      <span>Entry Punch</span>
                    </span>
                    {selectedAuditForReview.login_selfie && (
                      <button
                        type="button"
                        className="btn-selfie-dl shrink-0"
                        onClick={() =>
                          handleDownloadPhoto(
                            selectedAuditForReview.login_selfie,
                            `TCPL_Entry_Selfie_${selectedAuditForReview.employee_code}.jpg`
                          )
                        }
                      >
                        <Download size={9} />
                        <span>Save</span>
                      </button>
                    )}
                  </div>
                  {selectedAuditForReview.login_selfie ? (
                    <div
                      className="modal-selfie-img-wrap"
                      onClick={() =>
                        setPreviewImage({
                          url: selectedAuditForReview.login_selfie,
                          title: `Entry Punch Selfie - ${selectedAuditForReview.auditor_name}`,
                          gps: selectedAuditForReview.login_gps,
                          time: selectedAuditForReview.created_at,
                          filename: `TCPL_Entry_Selfie_${selectedAuditForReview.employee_code}.jpg`
                        })
                      }
                    >
                      <img src={selectedAuditForReview.login_selfie} alt="Entry Selfie" />
                      <span className="badge-preview">Enlarge</span>
                    </div>
                  ) : (
                    <div className="no-selfie-box text-[10px]">No Entry Photo</div>
                  )}
                  <span className="text-[9.5px] font-mono text-slate-400 mt-1 block truncate">
                    {selectedAuditForReview.login_gps || "GPS Stamped"}
                  </span>
                </div>

                <div className="modal-selfie-card">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1 truncate">
                      <Camera size={11} className="shrink-0" />
                      <span>Exit Punch</span>
                    </span>
                    {selectedAuditForReview.exit_selfie && (
                      <button
                        type="button"
                        className="btn-selfie-dl shrink-0"
                        onClick={() =>
                          handleDownloadPhoto(
                            selectedAuditForReview.exit_selfie,
                            `TCPL_Exit_Selfie_${selectedAuditForReview.employee_code}.jpg`
                          )
                        }
                      >
                        <Download size={9} />
                        <span>Save</span>
                      </button>
                    )}
                  </div>
                  {selectedAuditForReview.exit_selfie ? (
                    <div
                      className="modal-selfie-img-wrap"
                      onClick={() =>
                        setPreviewImage({
                          url: selectedAuditForReview.exit_selfie,
                          title: `Exit Punch Selfie - ${selectedAuditForReview.auditor_name}`,
                          gps: selectedAuditForReview.exit_gps,
                          time: selectedAuditForReview.exit_time,
                          filename: `TCPL_Exit_Selfie_${selectedAuditForReview.employee_code}.jpg`
                        })
                      }
                    >
                      <img src={selectedAuditForReview.exit_selfie} alt="Exit Selfie" />
                      <span className="badge-preview">Enlarge</span>
                    </div>
                  ) : (
                    <div className="no-selfie-box text-[10px]">Pending Exit</div>
                  )}
                  <span className="text-[9.5px] font-mono text-slate-400 mt-1 block truncate">
                    {selectedAuditForReview.exit_gps || "Shift In Progress"}
                  </span>
                </div>
              </div>

              {/* Review Decision Selector */}
              <div className="field mt-3">
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Admin Verification Decision:
                </label>
                <div className="decision-buttons-row">
                  <button
                    type="button"
                    className={`btn-decision approve ${reviewingStatus === "APPROVED" ? "active" : ""}`}
                    onClick={() => setReviewingStatus("APPROVED")}
                  >
                    <Check size={14} />
                    <span>Approve Audit</span>
                  </button>

                  <button
                    type="button"
                    className={`btn-decision reject ${reviewingStatus === "REJECTED" ? "active" : ""}`}
                    onClick={() => setReviewingStatus("REJECTED")}
                  >
                    <X size={14} />
                    <span>Reject Audit</span>
                  </button>

                  <button
                    type="button"
                    className={`btn-decision flag ${reviewingStatus === "FLAGGED" ? "active" : ""}`}
                    onClick={() => setReviewingStatus("FLAGGED")}
                  >
                    <AlertTriangle size={14} />
                    <span>Flag for Correction</span>
                  </button>
                </div>
              </div>

              {/* Review Remarks Input */}
              <div className="field mt-3">
                <label htmlFor="review-remarks" className="text-xs font-bold text-slate-300 block mb-1">
                  HQ Admin Review Remarks:
                </label>
                <textarea
                  id="review-remarks"
                  rows={3}
                  className="tcpl-textarea text-xs"
                  placeholder="Enter notes, verification feedback, or corrections required..."
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                />
              </div>

              {/* Download Excel Sheet Link */}
              {selectedAuditForReview.excel_file_data && (
                <div className="mt-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-emerald-400" />
                    <span className="text-xs text-slate-200">
                      {selectedAuditForReview.excel_file_name || "Audit Excel Sheet"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-download-mini"
                    onClick={() => handleDownloadExcel(selectedAuditForReview)}
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>

            <div className="admin-modal-footer flex items-center justify-between">
              <button
                type="button"
                className="btn-modal-delete-danger"
                onClick={() => handleDeleteAudit(selectedAuditForReview.id, selectedAuditForReview.tcpl_site)}
                title="Permanently remove this audit submission"
              >
                <Trash2 size={13} />
                <span>Delete Audit</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setSelectedAuditForReview(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-action-glow"
                  onClick={handleSubmitAuditReview}
                >
                  Save Review Decision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: AUDITOR DETAIL INSPECTION MODAL
      ========================================================= */}
      {selectedAuditor && (
        <div className="modal-backdrop" onClick={() => setSelectedAuditor(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-modal-back-pill"
                  onClick={() => setSelectedAuditor(null)}
                  title="Go Back"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <Users size={18} className="text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-sm md:text-base">Auditor Dossier: {selectedAuditor.full_name}</h3>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setSelectedAuditor(null)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="auditor-dossier-grid">
                <div className="dossier-item">
                  <span className="dossier-label">Employee Code</span>
                  <span className="dossier-val font-mono text-emerald-800 font-bold">
                    {selectedAuditor.employee_code || "AUD"}
                  </span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Account Status</span>
                  <span className={`status-chip ${selectedAuditor.account_status}`}>
                    {selectedAuditor.account_status}
                  </span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Email Address</span>
                  <span className="dossier-val text-slate-900 font-semibold">{selectedAuditor.email}</span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Assigned State</span>
                  <span className="dossier-val text-slate-900 font-semibold">📍 {selectedAuditor.assigned_state}</span>
                </div>
                <div className="dossier-item col-span-2">
                  <span className="dossier-label">Live Sign-up GPS Verification</span>
                  {selectedAuditor.signup_lat ? (
                    <div className="dossier-val text-emerald-800 font-semibold">
                      📍 {selectedAuditor.signup_location || "GPS Stamped"}
                      <div className="font-mono text-xs text-slate-600 mt-0.5">
                        Lat: {selectedAuditor.signup_lat}, Lng: {selectedAuditor.signup_lng}
                      </div>
                    </div>
                  ) : (
                    <span className="dossier-val text-slate-500 italic">No GPS location recorded</span>
                  )}
                </div>
              </div>

              {/* Status Change Buttons */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-800 block mb-2">Change Account Status:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-action-pill approve"
                    onClick={() => handleUpdateAuditorStatus(selectedAuditor.id, "approved")}
                  >
                    <Check size={13} />
                    <span>Approve / Activate</span>
                  </button>
                  <button
                    type="button"
                    className="btn-action-pill suspend"
                    onClick={() => handleUpdateAuditorStatus(selectedAuditor.id, "suspended")}
                  >
                    <X size={13} />
                    <span>Suspend Account</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setSelectedAuditor(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: ENLARGED SELFIE INSPECTION MODAL
      ========================================================= */}
      {previewImage && (
        <div className="modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div className="selfie-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="selfie-preview-header">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-modal-back-pill"
                  onClick={() => setPreviewImage(null)}
                  title="Go Back"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-1.5 truncate">
                  <Camera size={16} className="text-emerald-700 shrink-0" />
                  <span className="font-bold text-slate-900 text-sm truncate">{previewImage.title}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setPreviewImage(null)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="selfie-preview-body">
              <div className="selfie-photo-frame">
                <img src={previewImage.url} alt="Enlarged Selfie Verification" className="enlarged-selfie-img" />
              </div>
              <div className="selfie-preview-metadata">
                <div>
                  <span className="font-bold text-emerald-800 text-[10.5px] uppercase tracking-wider block mb-0.5">
                    Exact Location Verification Stamp:
                  </span>
                  <span className="text-xs text-slate-900 font-bold block">
                    📍 {previewImage.gps || "Geotagged"}
                  </span>
                </div>
                {previewImage.time && (
                  <div className="text-right">
                    <span className="font-bold text-slate-600 text-[10.5px] uppercase tracking-wider block mb-0.5">
                      Recorded Timestamp:
                    </span>
                    <span className="text-xs text-slate-900 font-mono font-bold block">
                      {new Date(previewImage.time).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="selfie-preview-footer">
              <button
                type="button"
                className="btn-download-selfie-full"
                onClick={() =>
                  handleDownloadPhoto(
                    previewImage.url,
                    previewImage.filename || `TCPL_Audit_Selfie_${Date.now()}.jpg`
                  )
                }
              >
                <Download size={14} />
                <span>Download Watermarked Photo (JPG)</span>
              </button>
              <button
                type="button"
                className="btn-cancel btn-close-preview"
                onClick={() => setPreviewImage(null)}
              >
                <X size={14} />
                <span>Close Preview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: EDIT AUDITOR ASSIGNED STATE
      ========================================================= */}
      {editStateModalAuditor && (
        <div className="modal-backdrop" onClick={() => setEditStateModalAuditor(null)}>
          <div className="admin-modal-card max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-modal-back-pill"
                  onClick={() => setEditStateModalAuditor(null)}
                  title="Go Back"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-sm">Assign State to {editStateModalAuditor.full_name}</h3>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setEditStateModalAuditor(null)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-modal-body">
              <label htmlFor="select-assigned-state" className="text-xs text-slate-800 font-semibold block mb-1.5">
                Select Audit State / Zone:
              </label>
              <select
                id="select-assigned-state"
                className="tcpl-select w-full"
                value={newStateVal}
                onChange={(e) => setNewStateVal(e.target.value)}
              >
                {INDIAN_STATES.filter(s => s !== "ALL").map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setEditStateModalAuditor(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-action-glow"
                onClick={handleUpdateAuditorState}
              >
                Save Assigned State
              </button>
            </div>
          </div>
        </div>
      )}
    </PodLayout>
  );
}
