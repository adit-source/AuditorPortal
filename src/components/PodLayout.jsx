import React, { useState } from "react";
import trcLogo from "../assets/trc-official-logo.png";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Clock,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  ExternalLink,
  Shield
} from "lucide-react";

export default function PodLayout({
  currentUser,
  roleBadge = "ADM",
  activeNav = "dashboard",
  onNavChange,
  onLogout,
  onSwitchRole,
  switchRoleLabel,
  reviewQueueBadge = "0",
  title = "TRC Consulting — Audit Operations Portal",
  children
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User initials & info
  const fullName = currentUser?.full_name || (roleBadge === "ADM" ? "Aditya Sharma (HQ Admin)" : "Field Auditor");
  const email = currentUser?.email || (roleBadge === "ADM" ? "admin@tcpl.com" : "auditor@tcpl.com");
  
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "TR";

  const handleNavClick = (tabKey) => {
    if (onNavChange) onNavChange(tabKey);
    setMobileMenuOpen(false);
  };

  return (
    <div className="pod-layout-container">
      {/* 1. LEFT SIDEBAR */}
      <aside className={`pod-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div>
          {/* Brand Card with Cyber Brackets */}
          <div className="pod-brand-badge-card">
            <span className="pod-brand-corner tl" />
            <span className="pod-brand-corner tr" />
            <span className="pod-brand-corner bl" />
            <span className="pod-brand-corner br" />

            <div className="pod-brand-inner-circle">
              <img
                src={trcLogo}
                alt="TRC Corporate Consulting"
                className="pod-brand-logo-img"
              />
              <span className="pod-brand-slogan">Let's Grow Together</span>
            </div>
          </div>

          {/* Section 1: OPERATIONS */}
          <span className="pod-nav-section-title">AUDIT OPERATIONS</span>
          <nav className="pod-nav-list">
            <button
              type="button"
              className={`pod-nav-item ${activeNav === "dashboard" ? "active" : ""}`}
              onClick={() => handleNavClick("dashboard")}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className={`pod-nav-item ${activeNav === "documents" ? "active" : ""}`}
              onClick={() => handleNavClick("documents")}
            >
              <FileSpreadsheet size={16} />
              <span>Submissions & Selfies</span>
              {reviewQueueBadge && reviewQueueBadge !== "0" && (
                <span className="pod-nav-badge">{reviewQueueBadge}</span>
              )}
            </button>
          </nav>

          {/* Section 2: ADMINISTRATION */}
          <span className="pod-nav-section-title">ADMINISTRATION</span>
          <nav className="pod-nav-list">
            <button
              type="button"
              className={`pod-nav-item ${activeNav === "users" ? "active" : ""}`}
              onClick={() => handleNavClick("users")}
            >
              <Users size={16} />
              <span>Manage Auditors</span>
            </button>

            <button
              type="button"
              className={`pod-nav-item ${activeNav === "logs" ? "active" : ""}`}
              onClick={() => handleNavClick("logs")}
            >
              <Clock size={16} />
              <span>Attendance Logs</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Logout Button */}
        {onLogout && (
          <div className="pod-sidebar-logout-section">
            <button
              type="button"
              className="pod-btn-sidebar-logout"
              onClick={onLogout}
              title="Sign out of portal"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="pod-sidebar-footer">
          <div className="pod-enterprise-status">
            <ShieldCheck size={16} />
            <span>TRC Enterprise</span>
          </div>
          <span className="pod-version-pill">v2.5</span>
        </div>
      </aside>

      {/* 2. MAIN CONTENT VIEWPORT */}
      <div className="pod-main-wrapper">
        {/* TOPBAR */}
        <header className="pod-topbar">
          <div className="pod-topbar-left">
            <button
              type="button"
              className="pod-btn-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="pod-topbar-title">{title}</h1>
          </div>

          <div className="pod-topbar-right">
            {/* Role Badge: ADM / AUDITOR */}
            <span className="pod-role-pill">
              <span className="pod-role-dot" />
              <span>{roleBadge}</span>
            </span>

            {/* Switch Role Button */}
            {onSwitchRole && (
              <button
                type="button"
                className="pod-btn-secondary"
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  background: "#f1f5f3",
                  color: "#073322",
                  borderColor: "#c9decb",
                  fontWeight: "600"
                }}
                onClick={onSwitchRole}
                title={switchRoleLabel || "Switch Role"}
              >
                <ExternalLink size={13} />
                <span>{switchRoleLabel || "Switch"}</span>
              </button>
            )}

            {/* User Profile Chip */}
            <div className="pod-user-chip">
              <div className="pod-user-avatar">{initials}</div>
              <div className="pod-user-details">
                <span className="pod-user-name" title={fullName}>{fullName}</span>
                <span className="pod-user-email" title={email}>{email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* 3. MAIN CANVAS */}
        <main className="pod-canvas">
          {children}
        </main>
      </div>
    </div>
  );
}
