import { useState, useEffect } from "react";
import trcLogo from "./assets/trc-logo-dark.png";
import TCPLAuditLanding from "./components/TCPLAuditLanding";
import AdminPortal from "./components/AdminPortal";
import IndusScrapLanding from "./components/IndusScrapLanding";
import IndusAdminPortal from "./components/IndusAdminPortal";
import { API_BASE_URL } from "./config";
import {
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  User,
  BadgeCheck,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Server,
  Building,
  MapPin,
  Fingerprint,
  Check,
  Users,
  Truck,
  Camera,
  FileSpreadsheet,
  LocateFixed,
  RefreshCw,
  Navigation,
  UserPlus,
  FileText
} from "lucide-react";
import "./App.css";
import "./styles/PodTheme.css";

const INDIAN_STATES = [
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

function App() {
  // Always start logged out so the site opens directly to the Login page
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Ensure every fresh open lands strictly on the Login page
    localStorage.removeItem("auditor_session");
  }, []);

  const [adminAuditorMode, setAdminAuditorMode] = useState(false);
  const [page, setPage] = useState("login"); // "login" | "register"
  const [backendStatus, setBackendStatus] = useState("checking"); // "online" | "offline" | "checking"

  // Simple form states (Field Auditor portal only)
  const [assignedPortal, setAssignedPortal] = useState("TCPL");
  const [fullName, setFullName] = useState("");
  const [assignedState, setAssignedState] = useState("Maharashtra");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Google Auth Modal & State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [googleNameInput, setGoogleNameInput] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); // { type: "success" | "error" | "info", message: string }

  const isLogin = page === "login";

  // Check backend connection on mount
  useEffect(() => {
    let isMounted = true;
    const checkApi = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, {
          signal: AbortSignal.timeout(12000)
        });
        if (res.ok && isMounted) {
          setBackendStatus("online");
        } else if (isMounted) {
          setBackendStatus("offline");
        }
      } catch {
        if (isMounted) {
          setBackendStatus("offline");
        }
      }
    };
    checkApi();
    return () => {
      isMounted = false;
    };
  }, []);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "Empty", color: "#475569" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    if (score === 1) return { score: 1, label: "Weak", color: "#ef4444" };
    if (score === 2) return { score: 2, label: "Medium", color: "#f59e0b" };
    if (score === 3) return { score: 3, label: "Strong", color: "#10b981" };
    return { score: 0, label: "Too short", color: "#ef4444" };
  };

  const strength = getPasswordStrength(password);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("auditor_session");
    setCurrentUser(null);
    setAdminAuditorMode(false);
    setPage("login");
    setAlertInfo({
      type: "info",
      message: "You have securely signed out of the Portal."
    });
  };

  // Google OAuth / Google Sign-in handler (Auditor only)
  const handleGoogleAuth = async (emailToUse, nameToUse, stateToUse) => {
    const finalEmail = emailToUse || googleEmailInput;
    if (!finalEmail || !finalEmail.includes("@")) {
      setAlertInfo({
        type: "error",
        message: "Please enter a valid Google email address."
      });
      return;
    }

    setGoogleLoading(true);
    setAlertInfo(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: finalEmail.trim().toLowerCase(),
          full_name: nameToUse || googleNameInput || finalEmail.split("@")[0],
          role: "Auditor",
          assigned_state: stateToUse || assignedState
        })
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setShowGoogleModal(false);
        setAlertInfo({
          type: "success",
          message: data.message || "Google authentication verified! Launching workspace..."
        });
        localStorage.setItem("auditor_session", JSON.stringify(data.user));
        setTimeout(() => {
          setCurrentUser(data.user);
        }, 600);
      } else {
        setAlertInfo({
          type: "error",
          message: data.message || "Google Authentication failed. Please try again."
        });
      }
    } catch {
      setAlertInfo({
        type: "error",
        message: "Unable to connect to Google authentication service."
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Form submission (Email + Password)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertInfo(null);

    // SIGN IN MODE
    if (isLogin) {
      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password
          })
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setAlertInfo({
            type: "success",
            message: data.message || "Signed in successfully. Launching workspace..."
          });
          if (rememberMe) {
            localStorage.setItem("auditor_session", JSON.stringify(data.user));
          }
          setTimeout(() => {
            setCurrentUser(data.user);
          }, 600);
        } else {
          setAlertInfo({
            type: "error",
            message: data.message || "Invalid credentials. Please verify your email and password."
          });
        }
      } catch {
        setAlertInfo({
          type: "error",
          message: "Unable to reach server. Please ensure backend is running."
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // SIGN UP / REGISTER MODE
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          role: "Auditor",
          assigned_state: assignedState,
          assigned_portal: assignedPortal
        })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setPage("login");
        setPassword("");
        setAlertInfo({
          type: "success",
          message: "Account created for TCPL Packaging! Please sign in."
        });
      } else {
        setAlertInfo({
          type: "error",
          message: data.message || "Registration failed. Please check your information."
        });
      }
    } catch {
      setAlertInfo({
        type: "error",
        message: "Unable to connect to database. Please check backend server status."
      });
    } finally {
      setLoading(false);
    }
  };

  // If user is authenticated, route to appropriate portal based on assigned_portal and role
  if (currentUser) {
    const isIndus = (currentUser.assigned_portal || "").toUpperCase() === "INDUS";

    if (isIndus) {
      if (currentUser.role === "Admin") {
        if (!adminAuditorMode) {
          return (
            <IndusAdminPortal
              currentUser={currentUser}
              onLogout={handleLogout}
              onSwitchToAuditor={() => setAdminAuditorMode(true)}
            />
          );
        } else {
          return (
            <IndusScrapLanding
              currentUser={currentUser}
              onLogout={handleLogout}
              isAdmin={true}
              onSwitchToAdmin={() => setAdminAuditorMode(false)}
            />
          );
        }
      }

      return (
        <IndusScrapLanding
          currentUser={currentUser}
          onLogout={handleLogout}
          isAdmin={false}
          onSwitchToAdmin={null}
        />
      );
    }

    // Default: TCPL Packaging Operations
    if (currentUser.role === "Admin") {
      if (!adminAuditorMode) {
        return (
          <AdminPortal
            currentUser={currentUser}
            onLogout={handleLogout}
            onSwitchToAuditor={() => setAdminAuditorMode(true)}
          />
        );
      } else {
        return (
          <TCPLAuditLanding
            currentUser={currentUser}
            onLogout={handleLogout}
            isAdmin={true}
            onSwitchToAdmin={() => setAdminAuditorMode(false)}
          />
        );
      }
    }

    return (
      <TCPLAuditLanding
        currentUser={currentUser}
        onLogout={handleLogout}
        isAdmin={false}
        onSwitchToAdmin={null}
      />
    );
  }

  // Otherwise, render the Simple Login / Sign Up Gateway
  return (
    <main className="portal">
      {/* Brand & Showcase Panel (Left) */}
      <section className="brand-panel" aria-label="Auditor Portal">
        {/* Glow & Backdrop Accents */}
        <div className="ambient-blur blur-1" />
        <div className="ambient-blur blur-2" />

        {/* Company Logo Header with Official TRC Logo */}
        <div className="brand" aria-label="TRC Consulting PVT. LTD.">
          <div className="brand-logo-card">
            <img src={trcLogo} alt="TRC - Let's Grow Together" className="brand-logo-img" />
          </div>
          <div className="brand-details">
            <span className="brand-consulting">CONSULTING PVT. LTD</span>
            <span className="brand-legal">VERIFIED SITE AUDIT & ATTENDANCE</span>
          </div>
        </div>

        {/* Main Pitch */}
        <div className="brand-copy">
          <div className="eyebrow">
            <span className="live-dot" /> TRC AUDIT SYSTEM
          </div>
          <h2>
            Operational Site<br />
            <span className="gradient-text">Auditor Portal</span>
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
            Field audits, dispatch records & verified live attendance.
          </p>
        </div>

        {/* Horizontal Feature Strip */}
        <div className="brand-features-horizontal">
          <div className="feature-h-item">
            <MapPin size={18} className="feature-h-icon" />
            <span>Site Inspections</span>
          </div>
          <div className="feature-h-divider" />
          <div className="feature-h-item">
            <User size={18} className="feature-h-icon" />
            <span>Live Attendance</span>
          </div>
          <div className="feature-h-divider" />
          <div className="feature-h-item">
            <FileText size={18} className="feature-h-icon" />
            <span>Audit Reports</span>
          </div>
        </div>

        {/* Shield Footer */}
        <div className="brand-shield-footer">
          <span className="shield-divider-line" />
          <div className="shield-tag-pill">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>SAFER AUDIT • BETTER OPERATIONS • STRONGER TOGETHER</span>
          </div>
          <span className="shield-divider-line" />
        </div>
      </section>

      {/* Form Panel (Right) */}
      <section className="form-panel">
        <div className="auth-card-container">
          <div className="auth-card">
        {/* Top Status Header */}
        <div className="form-top-bar">
          <div className="mobile-brand brand">
            <div className="dash-logo-card">
              <img src={trcLogo} alt="TRC Logo" className="mobile-brand-logo" />
            </div>
            <span className="brand-details">
              <span className="brand-consulting">TRC AUDITOR PORTAL</span>
            </span>
          </div>

          <div className="backend-status-pill">
            <Server size={12} />
            <span>
              {backendStatus === "online" ? (
                <span className="status-online">
                  <span className="dot-pulse-mini" /> Production Database Active
                </span>
              ) : (
                <span className="status-checking">Connecting to Secure Server...</span>
              )}
            </span>
          </div>
        </div>

        

          {/* Segmented Tab Switcher */}
            <div className="tab-switcher">
              <button
                type="button"
                className={`tab-btn ${isLogin ? "active" : ""}`}
                onClick={() => {
                  setPage("login");
                  setAlertInfo(null);
                }}
              >
                <User size={15} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${!isLogin ? "active" : ""}`}
                onClick={() => {
                  setPage("register");
                  setAlertInfo(null);
                }}
              >
                <UserPlus size={15} />
                <span>Sign Up</span>
              </button>
            </div>

          {/* Heading */}
          <div className="auth-heading">
            <h1>{isLogin ? "Auditor Sign In" : "Auditor Registration"}</h1>
            <p className="subtitle">
              {isLogin
                ? "Enter your credentials to record site entry selfie, upload sheets, and punch logout selfie."
                : "Create your auditor account to record verified on-site attendance & upload audit sheets."}
            </p>
          </div>

          {/* Alert Message Box */}
          {alertInfo && (
            <div className={`form-alert ${alertInfo.type}`}>
              {alertInfo.type === "success" ? (
                <CheckCircle size={16} />
              ) : alertInfo.type === "error" ? (
                <AlertTriangle size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              <span>{alertInfo.message}</span>
            </div>
          )}

          {/* GOOGLE SIGN IN / SIGN UP BUTTON */}
          <button
            type="button"
            className="btn-google-auth"
            onClick={() => setShowGoogleModal(true)}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLogin ? "Continue with Google" : "Sign up with Google"}</span>
          </button>

          {/* Simple Divider */}
          <div className="auth-divider">
            <span className="divider-line" />
            <span className="divider-text">or continue with email</span>
            <span className="divider-line" />
          </div>

          {/* Clean Form Element */}
          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <>
                {/* Project Selector */}
                <div className="field">
                  <label htmlFor="assigned-portal">Assigned Operation Project</label>
                  <div className="input-with-icon">
                    <Building size={16} className="input-icon text-emerald-400" />
                    <select
                      id="assigned-portal"
                      value={assignedPortal}
                      onChange={(e) => setAssignedPortal(e.target.value)}
                      className="custom-select"
                      style={{ color: "#34d399", fontWeight: 600 }}
                    >
                      <option value="TCPL">🏭 TCPL Packaging Inspection</option>
                      <option value="INDUS">🗼 Indus Towers Scrap Lifting</option>
                    </select>
                  </div>
                </div>

                {/* State Selection */}
                <div className="field">
                  <label htmlFor="assigned-state">Your Audit State</label>
                  <div className="input-with-icon">
                    <MapPin size={16} className="input-icon" />
                    <select
                      id="assigned-state"
                      value={assignedState}
                      onChange={(e) => setAssignedState(e.target.value)}
                      className="custom-select"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Full Name */}
                <div className="field">
                  <label htmlFor="full-name">Full Name</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input
                      id="full-name"
                      name="fullName"
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div className="field">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="field">
              <div className="field-header-row">
                <label htmlFor="password">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() =>
                      setAlertInfo({
                        type: "info",
                        message: "Password reset link sent to your email."
                      })
                    }
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isLogin ? "Enter your password" : "At least 8 characters"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter when registering */}
              {!isLogin && password && (
                <div className="strength-meter-wrap">
                  <div className="strength-bars">
                    <div
                      className={`strength-bar ${strength.score >= 1 ? "active" : ""}`}
                      style={{ background: strength.score >= 1 ? strength.color : "#e2e8f0" }}
                    />
                    <div
                      className={`strength-bar ${strength.score >= 2 ? "active" : ""}`}
                      style={{ background: strength.score >= 2 ? strength.color : "#e2e8f0" }}
                    />
                    <div
                      className={`strength-bar ${strength.score >= 3 ? "active" : ""}`}
                      style={{ background: strength.score >= 3 ? strength.color : "#e2e8f0" }}
                    />
                  </div>
                  <div className="strength-label">
                    <span>Security rating:</span>
                    <strong style={{ color: strength.color }}>{strength.label}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Remember Me Checkbox */}
            {isLogin && (
              <div className="checkbox-row">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark" />
                  <span>Remember this device</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button className="submit-button" type="submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading-state">
                  <span className="spinner" />
                  <span>Verifying...</span>
                </span>
              ) : (
                <>
                  <span>{isLogin ? "Sign In to Terminal" : "Create Account"}</span>
                  <ArrowRight size={16} className="btn-arrow" />
                </>
              )}
            </button>
          </form>

          {/* Switch Prompt */}
          <p className="switch">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              className="link"
              type="button"
              onClick={() => {
                const nextPage = isLogin ? "register" : "login";
                setPage(nextPage);
                setAlertInfo(null);
              }}
            >
              {isLogin ? "Sign up here" : "Sign in here"}
            </button>
          </p>
        </div>
      </div>

        <footer className="form-footer">
          <span>© 2026 TRC Consulting Pvt. Ltd. All rights reserved.</span>
          <span className="secure-badge">
            <span className="live-dot-mini" /> End-to-End Secure Terminal
          </span>
        </footer>
      </section>

      {/* GOOGLE SIGN IN / SIGN UP MODAL */}
      {showGoogleModal && (
        <div className="modal-backdrop" onClick={() => setShowGoogleModal(false)}>
          <div className="google-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="google-modal-header">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3 className="font-bold text-white">Sign in with Google</h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowGoogleModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="google-modal-body">
              <p className="text-sm text-slate-300">
                Choose an Auditor account to sign in instantly:
              </p>

              {/* 1-Click Fast Presets for Field Auditors & Admin */}
              <div className="google-accounts-list">
                {/* 0. HQ Admin Console */}
                <button
                  type="button"
                  className="google-account-item admin-item"
                  onClick={() =>
                    handleGoogleAuth("admin@tcpl.com", "Aditya Sharma (HQ Admin)", "HQ / All States")
                  }
                >
                  <div className="google-avatar bg-emerald-700">
                    <ShieldCheck size={18} className="text-white" />
                  </div>
                  <div className="google-account-details">
                    <span className="google-name text-emerald-300 font-bold">
                      HQ System Admin (Aditya Sharma)
                    </span>
                    <span className="google-email">admin@tcpl.com • Manage & Review Auditors</span>
                  </div>
                  <Check size={16} className="text-emerald-400 opacity-80" />
                </button>

                {/* 1. Field Auditor 1 */}
                <button
                  type="button"
                  className="google-account-item"
                  onClick={() =>
                    handleGoogleAuth("vikram.patil@tcpl.com", "Vikram Patil", "Maharashtra")
                  }
                >
                  <div className="google-avatar bg-emerald-500">VP</div>
                  <div className="google-account-details">
                    <span className="google-name">Vikram Patil (Field Auditor)</span>
                    <span className="google-email">vikram.patil@tcpl.com • Maharashtra Hubs</span>
                  </div>
                  <Check size={16} className="text-emerald-400 opacity-60" />
                </button>

                {/* 2. Field Auditor 2 */}
                <button
                  type="button"
                  className="google-account-item"
                  onClick={() =>
                    handleGoogleAuth("aditya.sharma@tcpl.com", "Aditya Sharma", "Gujarat")
                  }
                >
                  <div className="google-avatar bg-blue-500">AS</div>
                  <div className="google-account-details">
                    <span className="google-name">Aditya Sharma (Field Auditor)</span>
                    <span className="google-email">aditya.sharma@tcpl.com • Gujarat Facilities</span>
                  </div>
                  <Check size={16} className="text-emerald-400 opacity-60" />
                </button>

                {/* 3. Field Auditor 3 */}
                <button
                  type="button"
                  className="google-account-item"
                  onClick={() =>
                    handleGoogleAuth("rahul.verma@tcpl.com", "Rahul Verma", "Delhi NCR")
                  }
                >
                  <div className="google-avatar bg-purple-600">RV</div>
                  <div className="google-account-details">
                    <span className="google-name">Rahul Verma (Field Auditor)</span>
                    <span className="google-email">rahul.verma@tcpl.com • Delhi NCR Depots</span>
                  </div>
                  <Check size={16} className="text-emerald-400 opacity-60" />
                </button>
              </div>

              {/* Or enter custom Google Email */}
              <div className="custom-google-box">
                <label className="text-xs text-slate-400 mb-1 block">Or enter your Google Email address:</label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  className="tcpl-input mb-2"
                />
                <input
                  type="text"
                  placeholder="Auditor Full Name"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  className="tcpl-input mb-3"
                />
                <button
                  type="button"
                  className="btn-action-glow"
                  onClick={() => handleGoogleAuth()}
                  disabled={googleLoading}
                >
                  {googleLoading ? "Connecting to Google..." : "Continue with Google Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
