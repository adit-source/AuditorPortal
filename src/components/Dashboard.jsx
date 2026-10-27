import React, { useState, useEffect } from "react";
import trcLogo from "../assets/trc-logo-dark.png";
import {
  ShieldCheck,
  MapPin,
  Clock,
  Calendar,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  ChevronRight,
  TrendingUp,
  Award,
  RefreshCw,
  UserCheck,
  Building2
} from "lucide-react";

export default function Dashboard({ user, onLogout }) {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState("09:15 AM");
  const [secondsOnShift, setSecondsOnShift] = useState(4 * 3600 + 26 * 60);
  const [auditList, setAuditList] = useState([
    {
      id: "AUD-8921",
      title: "Statutory Cash & Vault Audit",
      client: "TRC Financial Services - Sector 18",
      category: "Statutory",
      due: "Today, 5:00 PM",
      progress: 85,
      status: "In Progress",
      priority: "High"
    },
    {
      id: "AUD-8922",
      title: "Fixed Asset Inventory Verification",
      client: "Nexus Logistics Hub - Warehouse B",
      category: "Physical",
      due: "Tomorrow, 12:00 PM",
      progress: 40,
      status: "Scheduled",
      priority: "Medium"
    },
    {
      id: "AUD-8923",
      title: "Quarterly IT Security & Access Control",
      client: "Apex Digital Solutions - Cyber City",
      category: "Compliance",
      due: "24 Oct 2026",
      progress: 100,
      status: "Completed",
      priority: "Low"
    }
  ]);

  const [notification, setNotification] = useState(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (isCheckedIn) {
        setSecondsOnShift((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isCheckedIn]);

  const formatShiftDuration = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}h ${mins
      .toString()
      .padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  const handlePunchToggle = () => {
    if (isCheckedIn) {
      setIsCheckedIn(false);
      showToast("Checked Out successfully. Shift recorded.", "info");
    } else {
      setIsCheckedIn(true);
      const nowStr = currentTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      setCheckInTime(nowStr);
      showToast("Checked In! GPS Geofence & Biometrics verified.", "success");
    }
  };

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCompleteTask = (id) => {
    setAuditList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Completed", progress: 100 } : item
      )
    );
    showToast(`Audit mission ${id} updated to Completed!`, "success");
  };

  return (
    <div className="dashboard-container">
      {/* Top Banner Toast */}
      {notification && (
        <div className={`dash-toast ${notification.type}`}>
          {notification.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navigation */}
      <header className="dash-header">
        <div className="dash-header-left">
          <div className="dash-logo">
            <div className="dash-logo-card">
              <img src={trcLogo} alt="TRC - Let's Grow Together" className="dash-logo-img" />
            </div>
            <div className="dash-logo-sub">
              <span className="dash-logo-title">AUDITOR PLATFORM</span>
              <span className="dash-logo-badge">CENTRAL COMPLIANCE</span>
            </div>
          </div>
          <div className="geofence-tag">
            <span className="pulse-green-dot" />
            <MapPin size={14} className="tag-icon" />
            <span>Branch #104 (Within 15m Geofence)</span>
          </div>
        </div>

        <div className="dash-header-right">
          <div className="clock-widget">
            <Clock size={15} />
            <span>{currentTime.toLocaleTimeString()}</span>
            <span className="clock-date">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric"
              })}
            </span>
          </div>

          <div className="user-profile-badge">
            <div className="user-avatar">
              {user?.fullName ? user.fullName[0].toUpperCase() : "A"}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.fullName || "Aditya Sharma"}</span>
              <span className="user-role">
                {user?.employeeCode ? `ID: ${user.employeeCode}` : "Senior Lead Auditor"}
              </span>
            </div>
          </div>

          <button className="btn-logout" onClick={onLogout} title="Sign Out">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Dashboard Body */}
      <main className="dash-main">
        {/* Hero Welcome & Attendance Card */}
        <div className="dash-hero-grid">
          {/* Left Greeting & Status */}
          <div className="greeting-card">
            <div className="greeting-pill">
              <ShieldCheck size={14} />
              <span>AES-256 SECURED WORKSPACE</span>
            </div>
            <h2>Welcome back, {user?.fullName?.split(" ")[0] || "Auditor"}!</h2>
            <p className="greeting-desc">
              Your physical geofence location is synced with TRC Central Compliance.
              All audit checklists, image evidence, and time logs are cryptographically sealed.
            </p>

            <div className="greeting-stats-row">
              <div className="mini-stat">
                <span className="mini-stat-label">Shift Status</span>
                <span className={`status-badge-live ${isCheckedIn ? "active" : "inactive"}`}>
                  <span className="stat-dot" />
                  {isCheckedIn ? "On Duty" : "Checked Out"}
                </span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-label">Check-in Timestamp</span>
                <span className="mini-stat-value">{isCheckedIn ? checkInTime : "--:--"}</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-label">Logged Shift Time</span>
                <span className="mini-stat-value timer-text">
                  {isCheckedIn ? formatShiftDuration(secondsOnShift) : "Paused"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Punch-in Action Widget */}
          <div className="attendance-widget-card">
            <div className="widget-header">
              <div className="widget-title">
                <Clock size={16} className="accent-icon" />
                <span>Geofenced Attendance</span>
              </div>
              <span className="geo-verified-pill">
                <MapPin size={12} /> GPS Locked
              </span>
            </div>

            <div className="attendance-visual">
              <div className={`radar-ring ${isCheckedIn ? "pulsing" : ""}`}>
                <div className="radar-inner">
                  <UserCheck size={36} className="radar-icon" />
                </div>
              </div>
            </div>

            <div className="attendance-info">
              <p className="location-name">
                <Building2 size={14} /> TRC Regional HQ, Cyber Towers
              </p>
              <p className="ip-verified">IP: 192.168.1.104 • Secure Terminal</p>
            </div>

            <button
              onClick={handlePunchToggle}
              className={`btn-punch ${isCheckedIn ? "btn-punch-out" : "btn-punch-in"}`}
            >
              {isCheckedIn ? "Punch Out / End Shift" : "Punch In / Start Shift"}
            </button>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon-box green">
              <Award size={20} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Compliance Score</span>
              <span className="kpi-value">99.8%</span>
              <span className="kpi-trend positive">
                <TrendingUp size={12} /> +1.4% vs last week
              </span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-box blue">
              <FileText size={20} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Today's Audits</span>
              <span className="kpi-value">3 Assigned</span>
              <span className="kpi-sub">1 Completed • 2 In Progress</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-box amber">
              <UploadCloud size={20} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Evidence Uploaded</span>
              <span className="kpi-value">24 Documents</span>
              <span className="kpi-sub">All GPS metadata stamped</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-box purple">
              <ShieldCheck size={20} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Verification Rate</span>
              <span className="kpi-value">100% Passed</span>
              <span className="kpi-sub">0 Pending discrepancy flags</span>
            </div>
          </div>
        </div>

        {/* Audit Schedule & Checklist Section */}
        <div className="content-columns">
          {/* Main Table: Assigned Audits */}
          <div className="card-panel table-panel">
            <div className="panel-header">
              <div>
                <h3>Assigned Audit Engagements</h3>
                <p className="panel-sub">Real-time statutory verification tasks & inspection milestones</p>
              </div>
              <button
                className="btn-refresh"
                onClick={() => showToast("Engagements re-synced with TRC Cloud", "info")}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            <div className="audits-list">
              {auditList.map((audit) => (
                <div key={audit.id} className="audit-item">
                  <div className="audit-main-info">
                    <div className="audit-title-row">
                      <span className="audit-id">{audit.id}</span>
                      <span className={`priority-tag ${audit.priority.toLowerCase()}`}>
                        {audit.priority} Priority
                      </span>
                      <span className={`status-pill-small ${audit.status.toLowerCase().replace(" ", "-")}`}>
                        {audit.status}
                      </span>
                    </div>
                    <h4 className="audit-name">{audit.title}</h4>
                    <p className="audit-client">
                      <Building2 size={13} /> {audit.client}
                    </p>
                  </div>

                  <div className="audit-progress-block">
                    <div className="progress-labels">
                      <span>Completion</span>
                      <span>{audit.progress}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${audit.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="audit-actions">
                    <div className="due-date">
                      <Calendar size={13} />
                      <span>{audit.due}</span>
                    </div>
                    {audit.status !== "Completed" ? (
                      <button
                        className="btn-action-small"
                        onClick={() => handleCompleteTask(audit.id)}
                      >
                        <CheckCircle2 size={14} /> Mark Completed
                      </button>
                    ) : (
                      <span className="verified-badge">
                        <CheckCircle2 size={14} /> Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Security Feed & Quick Tools */}
          <div className="side-column">
            {/* Quick Tools Box */}
            <div className="card-panel quick-tools-card">
              <h3>Quick Verification Tools</h3>
              <div className="tools-buttons">
                <button
                  className="tool-btn"
                  onClick={() => showToast("Camera sensor ready for photo geotagging", "info")}
                >
                  <UploadCloud size={16} />
                  <span>Upload Audit Evidence</span>
                  <ChevronRight size={14} className="chevron" />
                </button>
                <button
                  className="tool-btn"
                  onClick={() => showToast("Inspection Checklist PDF generated", "success")}
                >
                  <FileText size={16} />
                  <span>Statutory Checklist</span>
                  <ChevronRight size={14} className="chevron" />
                </button>
                <button
                  className="tool-btn"
                  onClick={() => showToast("Geofence ping re-verified successfully", "success")}
                >
                  <MapPin size={16} />
                  <span>Verify Site Perimeter</span>
                  <ChevronRight size={14} className="chevron" />
                </button>
              </div>
            </div>

            {/* Live Audit Log Feed */}
            <div className="card-panel audit-log-panel">
              <div className="panel-header">
                <h3>Live Security Feed</h3>
                <span className="live-dot-tag">
                  <span className="pulse-green-dot" /> LIVE
                </span>
              </div>
              <ul className="log-timeline">
                <li className="log-item">
                  <span className="log-dot green" />
                  <div className="log-content">
                    <p className="log-text">Geofence boundary matched at Branch #104</p>
                    <span className="log-time">Just now</span>
                  </div>
                </li>
                <li className="log-item">
                  <span className="log-dot blue" />
                  <div className="log-content">
                    <p className="log-text">Biometric photo hash verified with TRC Vault</p>
                    <span className="log-time">14 mins ago</span>
                  </div>
                </li>
                <li className="log-item">
                  <span className="log-dot purple" />
                  <div className="log-content">
                    <p className="log-text">Shift attendance checked in (09:15 AM)</p>
                    <span className="log-time">4 hrs ago</span>
                  </div>
                </li>
                <li className="log-item">
                  <span className="log-dot" />
                  <div className="log-content">
                    <p className="log-text">End-to-End SSL/TLS handshake established</p>
                    <span className="log-time">09:14 AM</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
