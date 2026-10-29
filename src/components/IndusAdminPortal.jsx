import React, { useState, useEffect } from "react";
import trcLogo from "../assets/trc-logo-dark.png";
import PodLayout from "./PodLayout";
import PodDashboardHeader from "./PodDashboardHeader";
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
  Truck,
  Scale,
  Radio,
  FileText,
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

const SCRAP_CATEGORIES = [
  "ALL",
  "Battery Scrap",
  "Copper Cable Scrap",
  "Tower Structural Iron Scrap",
  "Diesel Generator (DG) Scrap",
  "Optical Fiber & Cable Scrap",
  "SMPS / Power Plant Scrap",
  "Aluminium & Metal Scrap",
  "Shelter & Enclosure Scrap"
];

export default function IndusAdminPortal({ currentUser, onLogout, onSwitchToAuditor }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "audits" | "auditors" | "attendance"
  const [activeNav, setActiveNav] = useState("dashboard"); // "dashboard" | "documents" | "users" | "logs"
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalAudits: 0,
    approvedAudits: 0,
    pendingAudits: 0,
    totalTonnageMT: 0,
    totalAuditors: 0,
    activeSites: 0,
  });

  // Audits and Auditors lists
  const [audits, setAudits] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [auditorSearch, setAuditorSearch] = useState("");
  const [auditorStateFilter, setAuditorStateFilter] = useState("ALL");

  // Selected for Inspect / Review
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [selectedAuditor, setSelectedAuditor] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("APPROVED");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch all Indus Data
  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, auditsRes, auditorsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/indus/overview`),
        fetch(`${API_BASE_URL}/indus/audits`),
        fetch(`${API_BASE_URL}/indus/auditors`),
      ]);

      if (overviewRes.ok) {
        const d = await overviewRes.json();
        if (d.overview) setStats(d.overview);
      }
      if (auditsRes.ok) {
        const d = await auditsRes.json();
        if (d.audits) setAudits(d.audits);
      }
      if (auditorsRes.ok) {
        const d = await auditorsRes.json();
        if (d.auditors) setAuditors(d.auditors);
      }
    } catch (err) {
      console.error("Fetch Indus data error:", err);
      showToast("error", "Failed to refresh data from server");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Attendance Logs when on attendance tab
  useEffect(() => {
    if (activeTab !== "attendance") return;
    const fetchAttendance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/attendance`);
        const data = await res.json();
        if (data.success) {
          setAttendanceLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Attendance fetch error:", err);
      }
    };
    fetchAttendance();
  }, [activeTab, refreshKey]);

  // Review Audit (Approve / Reject)
  const handleReviewAudit = async () => {
    if (!selectedAudit) return;
    try {
      const res = await fetch(`${API_BASE_URL}/indus/audits/${selectedAudit.id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          remarks: reviewRemarks || `Scrap audit ${reviewStatus.toLowerCase()} by Indus Admin`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Record #IND-${selectedAudit.id} marked as ${reviewStatus}`);
        setSelectedAudit(null);
        setReviewRemarks("");
        setRefreshKey(prev => prev + 1);
      } else {
        showToast("error", data.message || "Failed to update review status");
      }
    } catch (err) {
      console.error("Review audit error:", err);
      showToast("error", "Network error during review");
    }
  };

  // Delete Audit Record
  const handleDeleteAudit = async (id, doNo) => {
    if (!window.confirm(`Are you sure you want to delete scrap dispatch record #IND-${id} (DO: ${doNo || "N/A"})?`)) {
      return;
    }
    try {
      const res = await fetch(`http://auditorportal-backend.onrender.com/api/indus/audits/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Record #IND-${id} deleted successfully`);
        if (selectedAudit?.id === id) setSelectedAudit(null);
        setRefreshKey(prev => prev + 1);
      } else {
        showToast("error", data.message || "Failed to delete record");
      }
    } catch (err) {
      console.error("Delete audit error:", err);
      showToast("error", "Connection error");
    }
  };

  // Update Auditor Status (Approved / Suspended)
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
      } else {
        showToast("error", data.message || "Failed to update auditor status");
      }
    } catch {
      showToast("error", "Network error updating auditor status");
    }
  };

  // Delete Auditor
  const handleDeleteAuditor = async (auditorId, auditorName) => {
    if (!window.confirm(`Are you sure you want to delete auditor "${auditorName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auditors/${auditorId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Auditor ${auditorName} deleted successfully`);
        setRefreshKey(prev => prev + 1);
      } else {
        showToast("error", data.message || "Failed to delete auditor");
      }
    } catch {
      showToast("error", "Network error deleting auditor");
    }
  };

  // Filtered Audits
  const filteredAudits = audits.filter(a => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      (a.site_id && a.site_id.toLowerCase().includes(q)) ||
      (a.site_name && a.site_name.toLowerCase().includes(q)) ||
      (a.vendor_name && a.vendor_name.toLowerCase().includes(q)) ||
      (a.vehicle_number && a.vehicle_number.toLowerCase().includes(q)) ||
      (a.auditor_name && a.auditor_name.toLowerCase().includes(q)) ||
      (a.employee_code && a.employee_code.toLowerCase().includes(q)) ||
      (a.do_no && a.do_no.toLowerCase().includes(q)) ||
      (a.lot_no && a.lot_no.toLowerCase().includes(q)) ||
      (a.auction_no && a.auction_no.toLowerCase().includes(q)) ||
      (a.warehouse_location && a.warehouse_location.toLowerCase().includes(q)) ||
      (a.asset_name && a.asset_name.toLowerCase().includes(q));

    const matchStatus = statusFilter === "ALL" || a.audit_status === statusFilter;
    const matchCategory = categoryFilter === "ALL" || a.scrap_category === categoryFilter || a.asset_name === categoryFilter;

    return matchSearch && matchStatus && matchCategory;
  });

  // Filtered Auditors
  const filteredAuditors = auditors.filter(aud => {
    const q = auditorSearch.toLowerCase();
    const matchSearch =
      !auditorSearch ||
      (aud.full_name && aud.full_name.toLowerCase().includes(q)) ||
      (aud.employee_code && aud.employee_code.toLowerCase().includes(q)) ||
      (aud.email && aud.email.toLowerCase().includes(q));

    const matchState = auditorStateFilter === "ALL" || aud.assigned_state === auditorStateFilter;
    return matchSearch && matchState;
  });

  // Download Photo
  const handleDownloadPhoto = (dataUrl, filename) => {
    if (!dataUrl) {
      showToast("error", "No photo available to download");
      return;
    }
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename || "Indus_Photo.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", `Downloaded ${filename}`);
  };

  // Export Single Audit in exact Microsoft Forms Response Format with Embedded Live Photos
  const handleExportSingleAuditExcel = (audit) => {
    if (!audit) return;
    const id = audit.id;
    const passNo = `IND-${id}`;
    const timestamp = audit.created_at ? new Date(audit.created_at).toLocaleString("en-IN") : new Date().toLocaleString("en-IN");
    const auditor = audit.auditor_name || "Indus Scrap Auditor";
    const empCode = audit.employee_code || "AUD-INDUS";
    const warehouse = audit.warehouse_location || audit.site_name || "";
    const asset = audit.asset_name || audit.scrap_category || "";
    const lot = audit.lot_no || "";
    const auction = audit.auction_no || "";
    const aucDate = audit.auction_date || "";
    const ninetyDate = audit.ninety_percent_date || "";
    const doStat = audit.do_status || "New DO";
    const doNum = audit.do_no || audit.site_id || "";
    const doDt = audit.do_date || "";
    const lastDelDate = audit.last_delivery_date || "";
    const totQty = audit.total_quantity || "";
    const doVal = audit.do_value || "";
    const invDt = audit.invoice_date || "";
    const invNo = audit.invoice_no || "";
    const txnNo = audit.transaction_no || "";
    const curQty = audit.quantity || `${audit.net_weight || 0} MT`;
    const totVal = audit.total_value || "";
    const vendor = audit.vendor_name || "";
    const vehicle = audit.vehicle_number || "";
    const driver = audit.driver_name || "";
    const phone = audit.driver_phone || "";
    const slipNo = audit.weighbridge_slip_no || "";
    const gross = audit.gross_weight || 0;
    const tare = audit.tare_weight || 0;
    const net = audit.net_weight || 0;
    const gpsIn = audit.login_gps || "Verified";
    const entryImg = audit.login_selfie;
    const exitImg = audit.exit_selfie;

    const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
      body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; }
      table { border-collapse: collapse; width: 100%; }
      th { background-color: #059669; color: #ffffff; font-weight: bold; border: 1px solid #047857; padding: 10px; font-size: 10pt; text-align: left; }
      td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 9.5pt; vertical-align: top; }
      .header-title { background-color: #064e3b; color: #ffffff; font-size: 14pt; font-weight: bold; text-align: center; padding: 14px; }
      .section-divider { background-color: #f0fdf4; color: #065f46; font-weight: bold; font-size: 10.5pt; border: 1px solid #a7f3d0; padding: 8px 10px; }
      .label-cell { background-color: #f8fafc; font-weight: bold; color: #334155; }
      .value-cell { background-color: #ffffff; color: #0f172a; }
    </style>
  </head>
  <body>
    <table>
      <tr>
        <th colspan="4" class="header-title">
          INDUS TOWERS SCRAP DISPATCH MANIFEST & WEIGHBRIDGE PASS #${passNo}
        </th>
      </tr>
      <tr>
        <td class="label-cell" style="width: 200px;">Official Gate-Pass No:</td>
        <td class="value-cell" style="color: #065f46; font-weight: bold;">#${passNo}</td>
        <td class="label-cell" style="width: 200px;">Submission Timestamp:</td>
        <td class="value-cell">${timestamp}</td>
      </tr>
      <tr>
        <td class="label-cell">Auditor Name:</td>
        <td class="value-cell">${auditor} (${empCode})</td>
        <td class="label-cell">Warehouse Yard:</td>
        <td class="value-cell">${warehouse}</td>
      </tr>
      <tr>
        <td class="label-cell">Asset / Scrap:</td>
        <td class="value-cell"><b>${asset}</b></td>
        <td class="label-cell">Lot Number:</td>
        <td class="value-cell" style="font-weight: bold; color: #059669;">${lot}</td>
      </tr>
      <tr>
        <td class="label-cell">Auction No & Date:</td>
        <td class="value-cell">${auction} (${aucDate})</td>
        <td class="label-cell">90% Payment Date:</td>
        <td class="value-cell">${ninetyDate}</td>
      </tr>
      <tr>
        <td class="label-cell">Delivery Order (DO):</td>
        <td class="value-cell" style="font-weight: bold; color: #059669;">${doNum} (${doStat})</td>
        <td class="label-cell">DO Date / Last Date:</td>
        <td class="value-cell">${doDt} / ${lastDelDate}</td>
      </tr>
      <tr>
        <td class="label-cell">Total DO Qty / Value:</td>
        <td class="value-cell">${totQty} / ₹ ${doVal}</td>
        <td class="label-cell">Invoice No / Date:</td>
        <td class="value-cell">${invNo || "N/A"} (${invDt || "N/A"})</td>
      </tr>
      <tr>
        <td class="label-cell">Current Lifted Qty:</td>
        <td class="value-cell" style="font-weight: bold; color: #d97706;">${curQty}</td>
        <td class="label-cell">Total Value Lifted:</td>
        <td class="value-cell" style="font-weight: bold; color: #d97706;">₹ ${totVal}</td>
      </tr>
      <tr>
        <td class="label-cell">Scrap Vendor (Buyer):</td>
        <td class="value-cell"><b>${vendor}</b></td>
        <td class="label-cell">Truck / Vehicle No:</td>
        <td class="value-cell" style="font-weight: bold; color: #059669;">${vehicle}</td>
      </tr>
      <tr>
        <td class="label-cell">Driver Name & Phone:</td>
        <td class="value-cell">${driver} (${phone})</td>
        <td class="label-cell">Weighbridge Slip:</td>
        <td class="value-cell">${slipNo}</td>
      </tr>
      <tr>
        <td class="label-cell">Gross Weight:</td>
        <td class="value-cell">${gross} MT</td>
        <td class="label-cell">Tare (Empty) Weight:</td>
        <td class="value-cell">${tare} MT</td>
      </tr>
      <tr style="background-color: #ecfdf5;">
        <td class="label-cell" style="background-color: #d1fae5; color: #064e3b; font-size: 11pt;">NET SCRAP TONNAGE:</td>
        <td class="value-cell" colspan="3" style="font-size: 14pt; font-weight: bold; color: #064e3b;">
          ${net} MT
        </td>
      </tr>
      <tr>
        <td class="label-cell">Live Verified GPS Address:</td>
        <td class="value-cell" colspan="3">${gpsIn}</td>
      </tr>
      <tr>
        <td class="label-cell">Status & Remarks:</td>
        <td class="value-cell" colspan="3"><b>${audit.audit_status || "SUBMITTED"}</b> • ${audit.admin_remarks || "Verified"}</td>
      </tr>
    </table>
  </body>
</html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Indus_Forms_GatePass_${passNo}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("success", `Downloaded Gate-Pass #${passNo} Excel`);
  };

  // Export All Audits to Master Excel
  const handleExportAllAuditsExcel = (auditsList) => {
    if (!auditsList || auditsList.length === 0) {
      showToast("error", "No scrap audits available to export");
      return;
    }

    const rowsHtml = auditsList.map((a, idx) => {
      const entryImg = a.login_selfie
        ? `<img src="${a.login_selfie}" width="90" height="90" style="object-fit:cover; border-radius:4px; border:1px solid #10b981;" />`
        : `<span style="color:#94a3b8; font-size:9pt;">No Entry Photo</span>`;
      const exitImg = a.exit_selfie
        ? `<img src="${a.exit_selfie}" width="90" height="90" style="object-fit:cover; border-radius:4px; border:1px solid #059669;" />`
        : `<span style="color:#94a3b8; font-size:9pt;">Pending Gate-Out</span>`;

      return `
      <tr>
        <td style="font-weight:bold; text-align:center;">${idx + 1}</td>
        <td style="color:#059669; font-weight:bold;">#IND-${a.id}</td>
        <td>${a.created_at ? new Date(a.created_at).toLocaleString("en-IN") : ""}</td>
        <td>${a.auditor_email || "auditor@indus.com"}</td>
        <td>${a.auditor_name || ""}</td>
        <td>${a.auditor_name || ""} (${a.employee_code || "AUD-INDUS"})</td>
        <td>${a.warehouse_location || a.site_name || ""}</td>
        <td><b>${a.asset_name || a.scrap_category || ""}</b></td>
        <td style="font-weight:bold; color:#059669;">${a.lot_no || ""}</td>
        <td>${a.auction_no || ""}</td>
        <td>${a.do_status || "New DO"}</td>
        <td style="font-weight:bold; color:#059669;">${a.do_no || a.site_id || ""}</td>
        <td>${a.do_date || ""}</td>
        <td>${a.total_quantity || ""}</td>
        <td>₹ ${a.do_value || ""}</td>
        <td>${a.quantity || `${a.net_weight || 0} MT`}</td>
        <td>₹ ${a.total_value || ""}</td>
        <td><b>${a.vendor_name || ""}</b></td>
        <td style="font-weight:bold; color:#059669;">${a.vehicle_number || ""}</td>
        <td>${a.driver_name || ""} (${a.driver_phone || ""})</td>
        <td>${a.weighbridge_slip_no || ""}</td>
        <td>${a.gross_weight || 0} MT</td>
        <td>${a.tare_weight || 0} MT</td>
        <td style="font-weight:bold; color:#064e3b; font-size:11pt;">${a.net_weight || 0} MT</td>
        <td>${a.login_gps || ""}</td>
        <td>${a.audit_status || "SUBMITTED"}</td>
        <td style="text-align:center; padding:6px;">${entryImg}</td>
        <td style="text-align:center; padding:6px;">${exitImg}</td>
      </tr>`;
    }).join("");

    const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
      body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; }
      table { border-collapse: collapse; }
      th { background-color: #059669; color: #ffffff; font-weight: bold; border: 1px solid #047857; padding: 8px 10px; font-size: 9.5pt; white-space: nowrap; text-align: left; }
      td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 9.5pt; vertical-align: middle; }
      tr:nth-child(even) { background-color: #f8fafc; }
      .app-title-banner { background-color: #064e3b; color: #ffffff; font-size: 14pt; font-weight: bold; padding: 12px; }
    </style>
  </head>
  <body>
    <table>
      <tr>
        <th colspan="28" class="app-title-banner">
          INDUS TOWERS SCRAP LIFTING • MASTER ALL DISPATCHES SPREADSHEET
        </th>
      </tr>
      <thead>
        <tr>
          <th>ID</th>
          <th>Gate-Pass ID</th>
          <th>Date & Time</th>
          <th>Email</th>
          <th>Auditor Name</th>
          <th>Auditor Info</th>
          <th>Warehouse / Yard</th>
          <th>Asset / Scrap Category</th>
          <th>Lot No</th>
          <th>Auction No</th>
          <th>DO Status</th>
          <th>DO Number</th>
          <th>DO Date</th>
          <th>Total DO Qty</th>
          <th>DO Value</th>
          <th>Current Lifted Qty</th>
          <th>Total Value</th>
          <th>Vendor Name (Buyer)</th>
          <th>Vehicle No</th>
          <th>Driver Info</th>
          <th>Weighbridge Slip No</th>
          <th>Gross (MT)</th>
          <th>Tare (MT)</th>
          <th>Net Scrap (MT)</th>
          <th>Verified Live GPS</th>
          <th>Review Status</th>
          <th>Entry Punch Live Selfie</th>
          <th>Exit Gate-Out Live Selfie</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </body>
</html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Indus_Reports_All_Audits_${new Date().toISOString().split("T")[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("success", `Exported ${auditsList.length} audits to Microsoft Forms Excel Sheet (.xls)`);
  };

  return (
    <PodLayout
      currentUser={currentUser}
      roleBadge="ADM"
      activeNav={activeNav}
      onNavChange={(navKey) => {
        setActiveNav(navKey);
        if (navKey === "dashboard") setActiveTab("overview");
        else if (navKey === "documents" || navKey === "review") setActiveTab("audits");
        else if (navKey === "users") setActiveTab("auditors");
        else if (navKey === "logs") setActiveTab("attendance");
        else setActiveTab(navKey);
      }}
      onLogout={onLogout}
      onSwitchRole={onSwitchToAuditor}
      switchRoleLabel="Indus Auditor"
      reviewQueueBadge={String(stats.pendingAudits || 0)}
      title="TRC Consulting — Indus Scrap Admin Console"
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
              {/* Signature Hero Banner and 6 KPI cards */}
              <PodDashboardHeader
                title="Indus Scrap Surveillance & Operations Console"
                subtitle={`${stats.totalAudits || 0} scrap gate-passes recorded • ${stats.totalTonnageMT || 0} MT net scrap lifted • ${stats.pendingAudits || 0} awaiting review`}
                primaryBtnText="Sync Records"
                onPrimaryClick={() => {
                  setRefreshKey(prev => prev + 1);
                  showToast("success", "Syncing Indus database records...");
                }}
                secondaryBtnText="Review Scrap Audits"
                secondaryBadge={String(stats.pendingAudits || 0)}
                onSecondaryClick={() => {
                  setActiveNav("documents");
                  setActiveTab("audits");
                }}
                kpiData={{
                  totalAudits: String(stats.totalAudits ?? 0),
                  pendingAudits: String(stats.pendingAudits ?? 0),
                  approvedAudits: String(stats.approvedAudits ?? 0),
                  totalAuditors: String(stats.totalAuditors ?? 0),
                  totalCartons: `${stats.totalTonnageMT || 0} MT`,
                  totalDiscrepancies: String(stats.activeSites ?? 0)
                }}
              />

              {/* Split Grids: Recent Auditors & Recent Audits */}
              <div className="admin-overview-columns">
                {/* Left Column: Recent Registered Indus Auditors */}
                <div className="admin-panel-card">
                  <div className="panel-card-header">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-emerald-400" />
                      <h3>Recently Registered Indus Auditors</h3>
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
                    {auditors.length === 0 ? (
                      <div className="empty-state-card">No Indus auditors registered yet.</div>
                    ) : (
                      auditors.slice(0, 5).map((aud) => (
                        <div key={aud.id} className="auditor-mini-item">
                          <div className="auditor-avatar-mini">
                            {aud.full_name?.substring(0, 2).toUpperCase() || "IN"}
                          </div>
                          <div className="auditor-mini-info">
                            <div className="auditor-header-line">
                              <span className="auditor-name-text">{aud.full_name}</span>
                              <span className="auditor-code-badge">
                                {aud.employee_code || "AUD-INDUS"}
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
                                {aud.account_status || "active"}
                              </span>
                            </div>
                            <div className="auditor-meta-sub">
                              <span className="auditor-state-tag">📍 {aud.assigned_state || "Delhi NCR"}</span>
                              <span className="dot-sep">•</span>
                              <span className="auditor-gps-tag text-emerald-400">
                                Indus Scrap Division
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn-action-small"
                            onClick={() => {
                              setSelectedAuditor(aud);
                              setActiveTab("auditors");
                              setActiveNav("users");
                            }}
                          >
                            Review
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Column: Recent Scrap Dispatches */}
                <div className="admin-panel-card">
                  <div className="panel-card-header">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-emerald-400" />
                      <h3>Recent Scrap Dispatches & Passes</h3>
                    </div>
                    <button
                      type="button"
                      className="btn-view-all"
                      onClick={() => {
                        setActiveTab("audits");
                        setActiveNav("documents");
                      }}
                    >
                      View All Dispatches →
                    </button>
                  </div>

                  <div className="audits-mini-list">
                    {audits.length === 0 ? (
                      <div className="empty-state-card">No scrap audits submitted yet.</div>
                    ) : (
                      audits.slice(0, 5).map((audit) => (
                        <div key={audit.id} className="audit-mini-item">
                          <div className="audit-mini-header">
                            <div className="audit-title-block">
                              <span className="audit-id-badge">#IND-{audit.id}</span>
                              <span className="audit-facility-name" title={audit.warehouse_location || audit.site_name}>
                                {audit.warehouse_location || audit.site_name || "Indus Yard"} • DO: {audit.do_no || audit.site_id || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={`status-chip ${audit.audit_status?.toLowerCase() || "submitted"}`}>
                                <span className="chip-dot" />
                                {audit.audit_status || "SUBMITTED"}
                              </span>
                              <button
                                type="button"
                                className="btn-action-icon text-red-400 hover:text-red-300 hover:bg-red-500/15"
                                onClick={() => handleDeleteAudit(audit.id, audit.do_no)}
                                title="Delete Scrap Audit"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          <div className="audit-mini-details">
                            <span className="detail-item">👤 {audit.auditor_name} ({audit.employee_code})</span>
                            <span className="dot-sep">•</span>
                            <span className="detail-item text-amber-400 font-semibold">
                              ⚖️ {audit.net_weight || 0} MT Net
                            </span>
                            <span className="dot-sep">•</span>
                            <span className="detail-item text-emerald-400">
                              📦 {audit.asset_name || audit.scrap_category || "Scrap"}
                            </span>
                          </div>

                          {/* Dual Photo Punch Slots */}
                          <div className="audit-mini-selfies-row">
                            <div className="selfie-card-slot">
                              <div className="selfie-slot-header">
                                <span className="selfie-slot-tag entry">
                                  <Camera size={11} />
                                  <span>Entry Punch</span>
                                </span>
                              </div>
                              {audit.login_selfie ? (
                                <div
                                  className="selfie-thumb-wrap"
                                  onClick={() =>
                                    setPreviewImage({
                                      url: audit.login_selfie,
                                      title: `Entry Punch Selfie - ${audit.auditor_name}`,
                                      gps: audit.login_gps,
                                      time: audit.created_at,
                                      filename: `Indus_Entry_${audit.id}.jpg`
                                    })
                                  }
                                >
                                  <img src={audit.login_selfie} alt="Entry Punch" />
                                  <div className="selfie-overlay-pill">
                                    <Eye size={10} />
                                    <span>Enlarge</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="no-selfie-box-mini">
                                  <span>No Entry Photo</span>
                                </div>
                              )}
                            </div>

                            <div className="selfie-card-slot">
                              <div className="selfie-slot-header">
                                <span className="selfie-slot-tag exit">
                                  <Camera size={11} />
                                  <span>Exit Gate-Out</span>
                                </span>
                              </div>
                              {audit.exit_selfie ? (
                                <div
                                  className="selfie-thumb-wrap"
                                  onClick={() =>
                                    setPreviewImage({
                                      url: audit.exit_selfie,
                                      title: `Exit Gate-Out Selfie - ${audit.auditor_name}`,
                                      gps: audit.exit_gps,
                                      time: audit.exit_time,
                                      filename: `Indus_Exit_${audit.id}.jpg`
                                    })
                                  }
                                >
                                  <img src={audit.exit_selfie} alt="Exit Gate-Out" />
                                  <div className="selfie-overlay-pill">
                                    <Eye size={10} />
                                    <span>Enlarge</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="no-selfie-box-mini">
                                  <span>Pending Gate-Out</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="audit-mini-actions">
                            <button
                              type="button"
                              className="btn-download-mini"
                              onClick={() => handleExportSingleAuditExcel(audit)}
                            >
                              <FileSpreadsheet size={12} />
                              <span>Forms Gate-Pass Excel (.xls)</span>
                              <Download size={11} className="ml-1 opacity-70" />
                            </button>
                            <button
                              type="button"
                              className="btn-review-mini"
                              onClick={() => {
                                setSelectedAudit(audit);
                                setReviewStatus(audit.audit_status === "SUBMITTED" ? "APPROVED" : audit.audit_status);
                                setReviewRemarks(audit.admin_remarks || "");
                              }}
                            >
                              Review & Verify
                            </button>
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
              TAB 2: SUBMISSIONS & SELFIES (SCRAP AUDITS)
          ========================================================= */}
          {activeTab === "audits" && (
            <div className="admin-audits-view">
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
                  <Truck size={15} />
                  <span>Indus Towers Scrap Dispatches ({filteredAudits.length})</span>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="admin-filter-bar">
                <div className="search-box">
                  <Search size={15} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by DO No, Lot No, Yard, Vendor, Truck No, Auditor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn-clear-search"
                      onClick={() => setSearchQuery("")}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="filter-select-wrapper">
                  <Filter size={13} className="text-slate-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="filter-select"
                  >
                    {SCRAP_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "ALL" ? "All Categories" : cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SUBMITTED">Pending (Submitted)</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="btn-filter-refresh"
                  onClick={() => handleExportAllAuditsExcel(filteredAudits)}
                  style={{ background: "#064e3b", borderColor: "#059669", color: "#ffffff", fontWeight: 700 }}
                  title="Export All Audits to Microsoft Forms Master Excel"
                >
                  <FileSpreadsheet size={14} />
                  <span>Export Master Excel (.xls)</span>
                </button>

                <button
                  type="button"
                  className="btn-filter-refresh"
                  onClick={() => {
                    setRefreshKey(prev => prev + 1);
                    showToast("success", "Refreshing audits from database...");
                  }}
                  title="Sync Audits"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  <span>Sync</span>
                </button>
              </div>

              {/* Audits Deck Showcase */}
              <div className="admin-audits-deck">
                {filteredAudits.length === 0 ? (
                  <div className="empty-state-card" style={{ gridColumn: "1 / -1", padding: "48px 24px", textAlign: "center" }}>
                    <Truck size={36} className="text-slate-500 mb-2" style={{ display: "inline-block" }} />
                    <p className="text-slate-300 font-bold">No scrap lifting audits match the selected filters.</p>
                  </div>
                ) : (
                  filteredAudits.map((audit) => (
                    <div key={audit.id} className="audit-showcase-card">
                      <div className="audit-card-top-bar">
                        <div className="audit-card-meta-pills">
                          <span className="audit-id-tag">#IND-{audit.id}</span>
                          <span className="audit-state-tag">
                            <MapPin size={11} className="text-emerald-400" />
                            {audit.state || audit.warehouse_location || "Warehouse Yard"}
                          </span>
                          <span className="audit-date-tag">
                            <Calendar size={11} className="text-slate-400" />
                            {new Date(audit.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>

                        <div className="audit-card-actions-quick">
                          <span className={`status-chip ${audit.audit_status?.toLowerCase() || "submitted"}`}>
                            <span className="chip-dot" />
                            {audit.audit_status || "SUBMITTED"}
                          </span>
                          <button
                            type="button"
                            className="btn-card-delete-icon"
                            onClick={() => handleDeleteAudit(audit.id, audit.do_no)}
                            title="Delete Dispatch Record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="audit-site-header">
                        <h4 className="audit-site-title" title={audit.warehouse_location || audit.site_name}>
                          {audit.warehouse_location || audit.site_name || "Indus Yard"} • DO: {audit.do_no || audit.site_id || "N/A"}
                        </h4>
                      </div>

                      <div className="audit-auditor-strip">
                        <div className="auditor-avatar-mini">
                          {audit.auditor_name?.substring(0, 2).toUpperCase() || "IN"}
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
                            {audit.exit_time && (
                              <span className="shift-time-item">
                                <span className="time-sep">•</span>
                                <Clock size={11} className="text-blue-400" />
                                <span>Out: {new Date(audit.exit_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Scrap Metrics Banner */}
                      <div className="audit-metrics-banner" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", margin: "12px 0", background: "#0a110c", padding: "10px", borderRadius: "8px", border: "1px solid #1a2c20" }}>
                        <div>
                          <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block" }}>Asset / Category</span>
                          <span style={{ fontSize: "12px", color: "#ffffff", fontWeight: 700 }} className="truncate block" title={audit.asset_name || audit.scrap_category}>
                            {audit.asset_name || audit.scrap_category || "Scrap"}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block" }}>Vendor (Buyer)</span>
                          <span style={{ fontSize: "12px", color: "#34d399", fontWeight: 700 }} className="truncate block" title={audit.vendor_name}>
                            {audit.vendor_name || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block" }}>Truck / Slip</span>
                          <span style={{ fontSize: "12px", color: "#ffffff", fontWeight: 700 }} className="truncate block">
                            {audit.vehicle_number || "N/A"} • #{audit.weighbridge_slip_no || "-"}
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "10px", color: "#10b981", textTransform: "uppercase", display: "block", fontWeight: 800 }}>Net Tonnage</span>
                          <span style={{ fontSize: "14px", color: "#34d399", fontWeight: 900 }}>
                            {audit.net_weight || 0} MT
                          </span>
                        </div>
                      </div>

                      {/* Dual Selfies Showcase */}
                      <div className="audit-selfies-deck">
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
                                title="Download Entry Photo"
                                onClick={() => handleDownloadPhoto(audit.login_selfie, `Indus_Entry_${audit.id}.jpg`)}
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
                                  title: `Arrival Punch Selfie - ${audit.auditor_name}`,
                                  gps: audit.login_gps,
                                  time: audit.created_at,
                                  filename: `Indus_Entry_${audit.id}.jpg`
                                })
                              }
                            >
                              <img src={audit.login_selfie} alt="Arrival Punch" />
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
                            <span className="truncate">{audit.login_gps || "GPS Verified"}</span>
                          </div>
                        </div>

                        <div className="selfie-slot-card exit-theme">
                          <div className="selfie-slot-header">
                            <div className="selfie-slot-title">
                              <span className="slot-dot exit-dot" />
                              <span>Departure / Gate-Out</span>
                            </div>
                            {audit.exit_selfie && (
                              <button
                                type="button"
                                className="btn-selfie-dl"
                                title="Download Exit Photo"
                                onClick={() => handleDownloadPhoto(audit.exit_selfie, `Indus_Exit_${audit.id}.jpg`)}
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
                                  title: `Exit Gate-Out Selfie - ${audit.auditor_name}`,
                                  gps: audit.exit_gps,
                                  time: audit.exit_time,
                                  filename: `Indus_Exit_${audit.id}.jpg`
                                })
                              }
                            >
                              <img src={audit.exit_selfie} alt="Exit Gate-Out" />
                              <div className="selfie-hover-overlay">
                                <Eye size={12} />
                                <span>Click to enlarge</span>
                              </div>
                            </div>
                          ) : (
                            <div className="selfie-slot-empty">
                              <Camera size={18} className="text-slate-600 mb-1" />
                              <span>Pending gate-out</span>
                            </div>
                          )}

                          <div className="selfie-slot-footer" title={audit.exit_gps || "GPS Stamped"}>
                            <MapPin size={11} className="text-blue-400 shrink-0" />
                            <span className="truncate">{audit.exit_gps || "Exit GPS Verified"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="audit-card-footer-strip">
                        <button
                          type="button"
                          className="btn-download-audit-sheet"
                          onClick={() => handleExportSingleAuditExcel(audit)}
                        >
                          <FileSpreadsheet size={13} />
                          <span>Microsoft Forms Gate-Pass (.xls)</span>
                          <Download size={12} className="opacity-70 ml-1" />
                        </button>

                        <button
                          type="button"
                          className="btn-review-audit-primary"
                          onClick={() => {
                            setSelectedAudit(audit);
                            setReviewStatus(audit.audit_status === "SUBMITTED" ? "APPROVED" : audit.audit_status);
                            setReviewRemarks(audit.admin_remarks || "");
                          }}
                        >
                          Review & Sign-Off
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 3: MANAGE AUDITORS
          ========================================================= */}
          {activeTab === "auditors" && (
            <div className="admin-auditors-view">
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
                  <span>Indus Field Auditors Management ({filteredAuditors.length})</span>
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
                    <button
                      type="button"
                      className="btn-clear-search"
                      onClick={() => setAuditorSearch("")}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="filter-select-wrapper">
                  <Filter size={13} className="text-slate-400" />
                  <select
                    value={auditorStateFilter}
                    onChange={(e) => setAuditorStateFilter(e.target.value)}
                    className="filter-select"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st === "ALL" ? "All States (National)" : st}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="btn-filter-refresh"
                  onClick={() => {
                    setRefreshKey(prev => prev + 1);
                    showToast("success", "Refreshing auditors list...");
                  }}
                  title="Sync Auditors"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  <span>Sync</span>
                </button>
              </div>

              {/* Auditors Table */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Auditor</th>
                      <th>Email & Role</th>
                      <th>Assigned State</th>
                      <th>Assigned Portal</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditors.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                          No Indus auditors found matching the criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditors.map((aud) => {
                        const isApproved = aud.account_status === "approved" || aud.account_status === "active";
                        const isSuspended = aud.account_status === "suspended";

                        return (
                          <tr key={aud.id}>
                            <td>
                              <div className="auditor-identity-cell">
                                <div className="auditor-avatar-table">
                                  {aud.full_name?.substring(0, 2).toUpperCase() || "IN"}
                                </div>
                                <div className="auditor-names-block">
                                  <span className="auditor-name-main">{aud.full_name}</span>
                                  <span className="auditor-code-sub">{aud.employee_code || "AUD-INDUS"}</span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="text-xs">
                                <span className="text-slate-300 block">{aud.email}</span>
                                <span className="text-emerald-400 font-semibold text-[11px]">{aud.role || "Auditor"}</span>
                              </div>
                            </td>

                            <td>
                              <span className="auditor-state-chip">
                                📍 {aud.assigned_state || "Delhi NCR"}
                              </span>
                            </td>

                            <td>
                              <span className="badge-portal-pill" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                                🗼 {aud.assigned_portal || "INDUS"}
                              </span>
                            </td>

                            <td>
                              <span className={`status-chip ${isApproved ? "approved" : isSuspended ? "suspended" : "pending"}`}>
                                <span className="chip-dot" />
                                {aud.account_status || "active"}
                              </span>
                            </td>

                            <td>
                              <div className="table-actions-cell" style={{ justifyContent: "flex-end" }}>
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
                                ) : (
                                  <button
                                    type="button"
                                    className="btn-action-pill activate"
                                    onClick={() => handleUpdateAuditorStatus(aud.id, "approved")}
                                    title="Activate / Approve Auditor"
                                  >
                                    <Check size={12} />
                                    <span>Activate</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  className="btn-action-icon delete"
                                  onClick={() => handleDeleteAuditor(aud.id, aud.full_name)}
                                  title="Delete Auditor"
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
              TAB 4: ATTENDANCE LOGS
          ========================================================= */}
          {activeTab === "attendance" && (
            <div className="admin-attendance-view">
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
                  <span>Shift Attendance & GPS Geofence Records</span>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Auditor</th>
                      <th>Punch Type</th>
                      <th>Time</th>
                      <th>Location / GPS Coordinates</th>
                      <th>Biometric Selfie</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                          No attendance shift records logged yet.
                        </td>
                      </tr>
                    ) : (
                      attendanceLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <div className="auditor-identity-cell">
                              <div className="auditor-avatar-table">
                                {log.auditor_name?.substring(0, 2).toUpperCase() || "AU"}
                              </div>
                              <div className="auditor-names-block">
                                <span className="auditor-name-main">{log.auditor_name}</span>
                                <span className="auditor-code-sub">{log.employee_code}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className={`status-chip ${log.punch_type === "IN" ? "approved" : "pending"}`}>
                              <span className="chip-dot" />
                              Shift Punch {log.punch_type}
                            </span>
                          </td>

                          <td>
                            <span className="text-xs text-slate-300">
                              {new Date(log.timestamp).toLocaleString("en-IN")}
                            </span>
                          </td>

                          <td>
                            <div className="text-xs">
                              <span className="font-semibold text-slate-200 block truncate max-w-[240px]" title={log.location_name}>
                                📍 {log.location_name || "Verified Live"}
                              </span>
                              {log.gps_lat && (
                                <span className="font-mono text-[10px] text-slate-500">
                                  {Number(log.gps_lat).toFixed(4)}°, {Number(log.gps_lng).toFixed(4)}°
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            {log.selfie_data ? (
                              <div
                                className="w-10 h-10 rounded border border-emerald-500/40 overflow-hidden cursor-pointer hover:border-emerald-400"
                                style={{ width: "36px", height: "36px" }}
                                onClick={() =>
                                  setPreviewImage({
                                    url: log.selfie_data,
                                    title: `Attendance Selfie - ${log.auditor_name}`,
                                    gps: log.location_name,
                                    time: log.timestamp,
                                    filename: `Attendance_${log.employee_code}.jpg`
                                  })
                                }
                              >
                                <img src={log.selfie_data} alt="Biometric Selfie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500">No Photo</span>
                            )}
                          </td>

                          <td>
                            <span className="status-chip approved">
                              <span className="chip-dot" />
                              {log.verification_status || "VERIFIED"}
                            </span>
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
          REVIEW AUDIT DECISION MODAL
      ========================================================= */}
      {selectedAudit && (
        <div className="modal-backdrop">
          <div className="modal-container review-modal" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-emerald-400" />
                <h3>Review Indus Scrap Dispatch #IND-{selectedAudit.id}</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedAudit(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Summary Card */}
              <div style={{ background: "#080e0a", padding: "14px", borderRadius: "8px", border: "1px solid #1a2c20" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Warehouse Yard</span>
                    <strong style={{ color: "#ffffff" }}>{selectedAudit.warehouse_location || selectedAudit.site_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>DO Number</span>
                    <strong style={{ color: "#34d399" }}>{selectedAudit.do_no || selectedAudit.site_id}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Scrap Category</span>
                    <strong style={{ color: "#ffffff" }}>{selectedAudit.asset_name || selectedAudit.scrap_category}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Net Scrap Tonnage</span>
                    <strong style={{ color: "#34d399", fontSize: "14px" }}>{selectedAudit.net_weight || 0} MT</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Vendor (Buyer)</span>
                    <strong style={{ color: "#ffffff" }}>{selectedAudit.vendor_name || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Vehicle / Slip No</span>
                    <strong style={{ color: "#ffffff" }}>{selectedAudit.vehicle_number || "N/A"} • #{selectedAudit.weighbridge_slip_no || "-"}</strong>
                  </div>
                </div>
              </div>

              {/* Photos Comparison */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 700, display: "block", marginBottom: "4px" }}>Arrival Live Punch</span>
                  {selectedAudit.login_selfie ? (
                    <img src={selectedAudit.login_selfie} alt="Arrival" style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "8px", border: "1px solid #10b981" }} />
                  ) : (
                    <div style={{ height: "130px", background: "#0e1611", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", color: "#64748b", fontSize: "12px" }}>No Entry Photo</div>
                  )}
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#60a5fa", fontWeight: 700, display: "block", marginBottom: "4px" }}>Exit Gate-Out Live Punch</span>
                  {selectedAudit.exit_selfie ? (
                    <img src={selectedAudit.exit_selfie} alt="Exit" style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "8px", border: "1px solid #3b82f6" }} />
                  ) : (
                    <div style={{ height: "130px", background: "#0e1611", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", color: "#64748b", fontSize: "12px" }}>Pending Exit Photo</div>
                  )}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", display: "block", marginBottom: "8px" }}>Sign-off Decision</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setReviewStatus("APPROVED")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: `2px solid ${reviewStatus === "APPROVED" ? "#10b981" : "#1a2c20"}`,
                      background: reviewStatus === "APPROVED" ? "rgba(16, 185, 129, 0.2)" : "#0a110c",
                      color: reviewStatus === "APPROVED" ? "#34d399" : "#94a3b8",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    ✓ APPROVE DISPATCH
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus("REJECTED")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: `2px solid ${reviewStatus === "REJECTED" ? "#ef4444" : "#1a2c20"}`,
                      background: reviewStatus === "REJECTED" ? "rgba(239, 68, 68, 0.2)" : "#0a110c",
                      color: reviewStatus === "REJECTED" ? "#fca5a5" : "#94a3b8",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    ✕ REJECT DISPATCH
                  </button>
                </div>
              </div>

              {/* Remarks Textarea */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", display: "block", marginBottom: "6px" }}>Admin Sign-Off Remarks</label>
                <textarea
                  rows="3"
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Enter review notes (e.g., Weighbridge slip and gate-pass verified with physical manifest)..."
                  style={{ width: "100%", background: "#080e0a", border: "1px solid #1a2c20", borderRadius: "8px", padding: "10px", color: "#ffffff", fontSize: "12px" }}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 20px" }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSelectedAudit(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-submit"
                onClick={handleReviewAudit}
                style={{ background: reviewStatus === "APPROVED" ? "#10b981" : "#dc2626", color: "#ffffff", fontWeight: 800, padding: "8px 18px", borderRadius: "8px" }}
              >
                Confirm {reviewStatus}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          HIGH-RES IMAGE PREVIEW MODAL
      ========================================================= */}
      {previewImage && (
        <div className="modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div className="modal-container image-preview-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
            <div className="modal-header">
              <h3>{previewImage.title || "Photo Record"}</h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setPreviewImage(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: "center", padding: "16px" }}>
              <img
                src={previewImage.url}
                alt="Enlarged Record"
                style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: "10px", objectFit: "contain", border: "1px solid #1a2c20" }}
              />
              {previewImage.gps && (
                <div style={{ marginTop: "12px", fontSize: "12px", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <MapPin size={14} />
                  <span>{previewImage.gps}</span>
                </div>
              )}
              {previewImage.time && (
                <div style={{ marginTop: "4px", fontSize: "11px", color: "#94a3b8" }}>
                  Timestamp: {new Date(previewImage.time).toLocaleString("en-IN")}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setPreviewImage(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-modal-submit"
                onClick={() => handleDownloadPhoto(previewImage.url, previewImage.filename)}
                style={{ background: "#10b981", color: "#040905", fontWeight: 700 }}
              >
                <Download size={14} className="mr-1" />
                <span>Download Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </PodLayout>
  );
}
