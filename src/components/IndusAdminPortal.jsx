import React, { useState, useEffect } from "react";
import trcLogo from "../assets/trc-logo-dark.png";
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
  Truck,
  Scale,
  Radio,
  FileText
} from "lucide-react";

export default function IndusAdminPortal({ currentUser, onLogout, onSwitchToAuditor }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "audits" | "auditors"
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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Review Modal
  const [selectedAudit, setSelectedAudit] = useState(null);
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
      console.error("Indus Admin fetch error:", err);
      showToast("error", "Failed to connect to backend server");
    } finally {
      setLoading(false);
    }
  };

  // Submit Review (Approve/Reject)
  const handleReviewSubmit = async (statusOverride, auditObj = null, remarksOverride = null) => {
    const targetAudit = auditObj || selectedAudit;
    if (!targetAudit) return;
    const finalStatus = statusOverride || reviewStatus || "APPROVED";
    const finalRemarks = (remarksOverride !== null ? remarksOverride : reviewRemarks).trim() ||
      (finalStatus === "APPROVED" ? "Verified & Gate-pass issued by Indus Admin" : "Rejected & Re-weigh required");

    try {
      const res = await fetch(`${API_BASE_URL}/indus/audits/${targetAudit.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: finalStatus,
          remarks: finalRemarks,
          audit_status: finalStatus,
          admin_remarks: finalRemarks,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Scrap audit #IND-${targetAudit.id} marked as ${finalStatus}!`);
        if (selectedAudit?.id === targetAudit.id) {
          setSelectedAudit(null);
          setReviewRemarks("");
        }
        setRefreshKey(prev => prev + 1);
      } else {
        showToast("error", data.message || "Failed to submit review");
      }
    } catch (err) {
      console.error("Review submit error:", err);
      showToast("error", "Connection error during review submission");
    }
  };

  // Delete Audit
  const handleDeleteAudit = async (id) => {
    if (!window.confirm(`Are you sure you want to permanently delete Indus Scrap record #IND-${id}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/indus/audits/${id}`, {
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

  // Filtered audits
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

  // Helper to trigger direct file/photo download
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
    const gpsOut = audit.exit_gps || "Verified";
    const entryImg = audit.login_selfie;
    const exitImg = audit.exit_selfie;

    const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Indus Reports Responses</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; color: #1e293b; }
      table { border-collapse: collapse; width: 100%; }
      .app-title-banner { background-color: #064e3b; color: #ffffff; font-size: 14pt; font-weight: bold; padding: 12px; text-align: left; }
      .app-sub-banner { background-color: #047857; color: #e2e8f0; font-size: 9.5pt; padding: 6px 12px; }
      th.ms-header { background-color: #059669; color: #ffffff; font-weight: bold; border: 1px solid #047857; padding: 8px 10px; font-size: 9.5pt; white-space: nowrap; text-align: left; }
      td.ms-cell { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 9.5pt; vertical-align: top; background-color: #ffffff; }
      td.ms-cell-highlight { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 9.5pt; vertical-align: top; background-color: #ecfdf5; font-weight: bold; color: #065f46; }
      .section-divider { background-color: #1e293b; color: #ffffff; font-weight: bold; font-size: 11pt; padding: 8px 12px; }
      .label-cell { background-color: #f1f5f9; font-weight: bold; color: #334155; border: 1px solid #cbd5e1; padding: 6px 10px; }
      .value-cell { background-color: #ffffff; border: 1px solid #cbd5e1; padding: 6px 10px; }
      .photo-box { text-align: center; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; }
    </style>
  </head>
  <body>
    <!-- MASTER TABULAR EXCEL SHEET MATCHING MICROSOFT FORMS 'INDUS REPORTS' -->
    <table>
      <tr>
        <th colspan="34" class="app-title-banner">
          INDUS REPORTS • FIELD AUDIT & SCRAP DISPATCH MASTER SPREADSHEET
        </th>
      </tr>
      <tr>
        <th colspan="34" class="app-sub-banner">
          Source Form: Indus Reports (forms.cloud.microsoft/r/dBQBDq9ki9) • Gate-Pass ID: #${passNo} • Status: ${audit.audit_status || "SUBMITTED"}
        </th>
      </tr>
      <tr><td colspan="34" style="height: 10px; border: none;"></td></tr>

      <thead>
        <tr>
          <th class="ms-header">ID</th>
          <th class="ms-header">Start time</th>
          <th class="ms-header">Completion time</th>
          <th class="ms-header">Email</th>
          <th class="ms-header">Name</th>
          <th class="ms-header">Auditor Name</th>
          <th class="ms-header">Warehouse Location</th>
          <th class="ms-header">Asset Name</th>
          <th class="ms-header">Lot No.</th>
          <th class="ms-header">Auction No.</th>
          <th class="ms-header">Auction Date</th>
          <th class="ms-header">90% Date</th>
          <th class="ms-header">Delivery Order Status</th>
          <th class="ms-header">DO No.</th>
          <th class="ms-header">Do Date</th>
          <th class="ms-header">Last Delivery Date</th>
          <th class="ms-header">Total Quantity</th>
          <th class="ms-header">Value</th>
          <th class="ms-header">Invoice Date</th>
          <th class="ms-header">Invoice No.</th>
          <th class="ms-header">Transaction No.</th>
          <th class="ms-header">Quantity</th>
          <th class="ms-header">Total Value</th>
          <th class="ms-header">Vender Name</th>
          <th class="ms-header">Vehicle No.</th>
          <th class="ms-header">Driver Name</th>
          <th class="ms-header">Driver Phone</th>
          <th class="ms-header">Weighbridge Slip No</th>
          <th class="ms-header">Gross Weight (MT)</th>
          <th class="ms-header">Tare Weight (MT)</th>
          <th class="ms-header">Net Scrap Weight (MT)</th>
          <th class="ms-header">Exact Live GPS Address</th>
          <th class="ms-header">Entry Live Punch Selfie</th>
          <th class="ms-header">Exit Gate-Out Live Selfie</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="ms-cell-highlight">${id}</td>
          <td class="ms-cell">${timestamp}</td>
          <td class="ms-cell">${timestamp}</td>
          <td class="ms-cell">${audit.auditor_email || "auditor@indus.com"}</td>
          <td class="ms-cell">${auditor}</td>
          <td class="ms-cell">${auditor} (${empCode})</td>
          <td class="ms-cell">${warehouse}</td>
          <td class="ms-cell"><b>${asset}</b></td>
          <td class="ms-cell-highlight">${lot}</td>
          <td class="ms-cell">${auction}</td>
          <td class="ms-cell">${aucDate}</td>
          <td class="ms-cell">${ninetyDate}</td>
          <td class="ms-cell">${doStat}</td>
          <td class="ms-cell-highlight">${doNum}</td>
          <td class="ms-cell">${doDt}</td>
          <td class="ms-cell">${lastDelDate}</td>
          <td class="ms-cell">${totQty}</td>
          <td class="ms-cell">₹ ${doVal}</td>
          <td class="ms-cell">${invDt || "N/A"}</td>
          <td class="ms-cell">${invNo || "N/A"}</td>
          <td class="ms-cell">${txnNo || "N/A"}</td>
          <td class="ms-cell">${curQty}</td>
          <td class="ms-cell">₹ ${totVal}</td>
          <td class="ms-cell"><b>${vendor}</b></td>
          <td class="ms-cell-highlight">${vehicle}</td>
          <td class="ms-cell">${driver}</td>
          <td class="ms-cell">${phone}</td>
          <td class="ms-cell">${slipNo}</td>
          <td class="ms-cell">${gross} MT</td>
          <td class="ms-cell">${tare} MT</td>
          <td class="ms-cell-highlight" style="font-size: 11pt; color: #065f46;">${net} MT</td>
          <td class="ms-cell">${gpsIn}</td>
          <td class="photo-box">
            ${entryImg ? `<img src="${entryImg}" width="140" height="105" alt="Entry Punch Selfie" style="border: 2px solid #10b981; border-radius: 4px;"/><br/><b style="font-size: 8pt; color: #065f46;">ENTRY PUNCH VERIFIED</b>` : `<span>Photo on Record</span>`}
          </td>
          <td class="photo-box">
            ${exitImg ? `<img src="${exitImg}" width="140" height="105" alt="Exit Gate-Out Selfie" style="border: 2px solid #f59e0b; border-radius: 4px;"/><br/><b style="font-size: 8pt; color: #b45309;">EXIT PUNCH VERIFIED</b>` : `<span>Photo on Record</span>`}
          </td>
        </tr>
      </tbody>
    </table>

    <br/><br/>

    <!-- DETAILED GATE-PASS DISPATCH CERTIFICATE SECTION -->
    <table>
      <tr>
        <th colspan="4" class="section-divider">
          OFFICIAL DISPATCH MANIFEST & WEIGHBRIDGE MEASUREMENTS SUMMARY
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
    link.download = `Indus_Reports_GatePass_${id}_Master.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("success", `Exported Gate-Pass #${passNo} to Excel`);
  };

  // Export Bulk Table of All Filtered Audits in exact Microsoft Forms Response Format
  const handleExportAllAuditsExcel = (auditsList) => {
    if (!auditsList || auditsList.length === 0) {
      showToast("error", "No audits available to export");
      return;
    }

    const rowsHtml = auditsList.map((a, index) => {
      const id = a.id;
      const ts = a.created_at ? new Date(a.created_at).toLocaleString("en-IN") : "";
      const entryImg = a.login_selfie ? `<img src="${a.login_selfie}" width="120" height="90" style="border:1px solid #10b981; border-radius:4px;"/><br/><span style="font-size:8pt; color:#065f46;">Verified</span>` : "Photo on Record";
      const exitImg = a.exit_selfie ? `<img src="${a.exit_selfie}" width="120" height="90" style="border:1px solid #f59e0b; border-radius:4px;"/><br/><span style="font-size:8pt; color:#b45309;">Verified</span>` : "Photo on Record";

      return `
      <tr>
        <td style="font-weight:bold; background-color:#ecfdf5; color:#064e3b;">#IND-${id}</td>
        <td>${ts}</td>
        <td>${ts}</td>
        <td>${a.auditor_email || "auditor@indus.com"}</td>
        <td>${a.auditor_name || ""}</td>
        <td>${a.auditor_name || ""} (${a.employee_code || "AUD-INDUS"})</td>
        <td>${a.warehouse_location || a.site_name || ""}</td>
        <td><b>${a.asset_name || a.scrap_category || ""}</b></td>
        <td style="font-weight:bold; color:#059669;">${a.lot_no || ""}</td>
        <td>${a.auction_no || ""}</td>
        <td>${a.auction_date || ""}</td>
        <td>${a.ninety_percent_date || ""}</td>
        <td>${a.do_status || "New DO"}</td>
        <td style="font-weight:bold; color:#059669;">${a.do_no || a.site_id || ""}</td>
        <td>${a.do_date || ""}</td>
        <td>${a.last_delivery_date || ""}</td>
        <td>${a.total_quantity || ""}</td>
        <td>₹ ${a.do_value || ""}</td>
        <td>${a.invoice_date || ""}</td>
        <td>${a.invoice_no || ""}</td>
        <td>${a.transaction_no || ""}</td>
        <td>${a.quantity || `${a.net_weight || 0} MT`}</td>
        <td>₹ ${a.total_value || ""}</td>
        <td><b>${a.vendor_name || ""}</b></td>
        <td style="font-weight:bold; color:#059669;">${a.vehicle_number || ""}</td>
        <td>${a.driver_name || ""}</td>
        <td>${a.driver_phone || ""}</td>
        <td>${a.weighbridge_slip_no || ""}</td>
        <td>${a.gross_weight || 0} MT</td>
        <td>${a.tare_weight || 0} MT</td>
        <td style="font-weight:bold; color:#064e3b; font-size:11pt;">${a.net_weight || 0} MT</td>
        <td>${a.login_gps || ""}</td>
        <td style="text-align:center; padding:6px; background-color:#f8fafc;">${entryImg}</td>
        <td style="text-align:center; padding:6px; background-color:#f8fafc;">${exitImg}</td>
      </tr>
      `;
    }).join("");

    const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Indus Reports Master</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; }
      table { border-collapse: collapse; }
      th { background-color: #059669; color: #ffffff; font-weight: bold; border: 1px solid #047857; padding: 8px 10px; font-size: 9.5pt; white-space: nowrap; text-align: left; }
      td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 9.5pt; vertical-align: middle; }
      tr:nth-child(even) { background-color: #f8fafc; }
      .app-title-banner { background-color: #064e3b; color: #ffffff; font-size: 14pt; font-weight: bold; padding: 12px; }
      .app-sub-banner { background-color: #047857; color: #e2e8f0; font-size: 9.5pt; padding: 6px 12px; }
    </style>
  </head>
  <body>
    <table>
      <tr>
        <th colspan="34" class="app-title-banner">
          INDUS REPORTS • MASTER ALL AUDITS SPREADSHEET (MICROSOFT FORMS COMPLIANT)
        </th>
      </tr>
      <tr>
        <th colspan="34" class="app-sub-banner">
          Source Form: Indus Reports (forms.cloud.microsoft/r/dBQBDq9ki9) • Total Records: ${auditsList.length} • Generated: ${new Date().toLocaleString("en-IN")}
        </th>
      </tr>
      <tr><td colspan="34" style="height: 10px; border: none;"></td></tr>
      <thead>
        <tr>
          <th>ID</th>
          <th>Start time</th>
          <th>Completion time</th>
          <th>Email</th>
          <th>Name</th>
          <th>Auditor Name</th>
          <th>Warehouse Location</th>
          <th>Asset Name</th>
          <th>Lot No.</th>
          <th>Auction No.</th>
          <th>Auction Date</th>
          <th>90% Date</th>
          <th>Delivery Order Status</th>
          <th>DO No.</th>
          <th>Do Date</th>
          <th>Last Delivery Date</th>
          <th>Total Quantity</th>
          <th>Value</th>
          <th>Invoice Date</th>
          <th>Invoice No.</th>
          <th>Transaction No.</th>
          <th>Quantity</th>
          <th>Total Value</th>
          <th>Vender Name</th>
          <th>Vehicle No.</th>
          <th>Driver Name</th>
          <th>Driver Phone</th>
          <th>Weighbridge Slip No</th>
          <th>Gross Weight (MT)</th>
          <th>Tare Weight (MT)</th>
          <th>Net Scrap Weight (MT)</th>
          <th>Exact Live GPS Address</th>
          <th>Entry Live Punch Selfie</th>
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
    <div className="admin-portal-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`landing-toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* LEFT SIDEBAR PANEL */}
      <aside className="admin-sidebar-panel">
        <div className="admin-sidebar-brand">
          <div className="admin-logo-box">
            <img src={trcLogo} alt="TRC Consulting" className="admin-logo-img" />
          </div>
          <div className="admin-title-wrap">
            <div className="admin-title-row">
              <span className="admin-title-badge">
                INDUS TOWERS SCRAP
              </span>
              <span className="admin-live-pill">
                <span className="pulse-mini" /> ACTIVE
              </span>
            </div>
            <h2 className="admin-sidebar-heading">HQ Scrap Admin Console</h2>
          </div>
        </div>

        <div className="admin-sidebar-content">
          <div className="admin-sidebar-nav-section">
            <span className="admin-nav-section-label">MAIN NAVIGATION</span>
            <nav className="admin-sidebar-nav">
              <button
                type="button"
                className={`admin-nav-item ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                <Layers size={17} />
                <span className="admin-nav-label">Indus Scrap Overview</span>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${activeTab === "audits" ? "active" : ""}`}
                onClick={() => setActiveTab("audits")}
              >
                <Truck size={17} />
                <span className="admin-nav-label">Scrap Audits & Passes</span>
                <span className="admin-tab-count">{stats.totalAudits}</span>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${activeTab === "auditors" ? "active" : ""}`}
                onClick={() => setActiveTab("auditors")}
              >
                <Users size={17} />
                <span className="admin-nav-label">Indus Field Auditors</span>
                <span className="admin-tab-count">{stats.totalAuditors}</span>
              </button>
            </nav>
          </div>

          <div className="admin-sidebar-tools-section">
            <span className="admin-nav-section-label">SYSTEM TOOLS</span>
            <div className="admin-sidebar-tools">
              <button
                type="button"
                className="btn-admin-sidebar-tool"
                onClick={() => setRefreshKey(prev => prev + 1)}
                title="Sync Database"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-emerald-400" : "text-emerald-400"} />
                <span>{loading ? "Syncing..." : "Sync Database"}</span>
              </button>

              {onSwitchToAuditor && (
                <button
                  type="button"
                  className="btn-admin-sidebar-tool"
                  onClick={onSwitchToAuditor}
                  title="Switch to Field Auditor View"
                >
                  <ExternalLink size={14} className="text-emerald-400" />
                  <span>Open Scrap Terminal</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user-card">
            <div className="admin-user-avatar" style={{ background: "rgba(16, 185, 129, 0.2)" }}>
              <Radio size={18} className="text-emerald-400" />
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{currentUser?.full_name || "Indus Scrap Admin"}</span>
              <span className="admin-user-role">Indus HQ Lead Admin</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-admin-sidebar-logout"
            onClick={onLogout}
            title="Sign out of Admin Console"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT CONTENT AREA */}
      <div className="admin-main-viewport">
        <main className="admin-main-container">
          {/* Top Welcome Strip */}
          <div className="admin-welcome-strip">
            <div>
              <h2 className="admin-welcome-title">
                <span>Indus Towers Scrap Lifting</span>{" "}
                <span className="text-emerald-400 font-extrabold">• HQ Admin Console</span>
              </h2>
              <p className="admin-welcome-sub">
                TRC Enterprise Verification Terminal • Live scrap lifting audits, weighbridge measurements & gate-passes
              </p>
            </div>
            <div className="admin-welcome-date-pill">
              <Calendar size={13} className="text-emerald-400" />
              <span className="font-mono text-xs text-slate-300">
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="admin-overview-view">
              {/* Stat Cards Grid */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-card-header">
                    <span className="stat-card-title">Scrap Gate-Passes</span>
                    <div className="stat-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                      <Truck size={18} />
                    </div>
                  </div>
                  <div className="stat-card-value">{stats.totalAudits}</div>
                  <div className="stat-card-footer text-emerald-400">
                    <CheckCircle2 size={12} />
                    <span>{stats.approvedAudits} Verified • {stats.pendingAudits} Pending</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-card-header">
                    <span className="stat-card-title">Total Net Tonnage</span>
                    <div className="stat-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                      <Scale size={18} />
                    </div>
                  </div>
                  <div className="stat-card-value">
                    {stats.totalTonnageMT} <span style={{ fontSize: "14px", color: "#f59e0b" }}>MT</span>
                  </div>
                  <div className="stat-card-footer text-amber-300">
                    <span>Computerized Weighbridge Verified</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-card-header">
                    <span className="stat-card-title">Active Tower Sites</span>
                    <div className="stat-icon-wrap" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
                      <Radio size={18} />
                    </div>
                  </div>
                  <div className="stat-card-value">{stats.activeSites}</div>
                  <div className="stat-card-footer text-blue-400">
                    <span>Telecommunication Hubs</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-card-header">
                    <span className="stat-card-title">Field Scrap Auditors</span>
                    <div className="stat-icon-wrap" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>
                      <Users size={18} />
                    </div>
                  </div>
                  <div className="stat-card-value">{stats.totalAuditors}</div>
                  <div className="stat-card-footer text-purple-300">
                    <span>Deployed in Field Operations</span>
                  </div>
                </div>
              </div>

              {/* Recent Scrap Submissions Card */}
              <div className="admin-panel-card">
                <div className="panel-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Truck size={16} className="text-emerald-400" />
                    <h3>Recent Scrap Lifting Submissions</h3>
                  </div>
                  <button
                    type="button"
                    className="btn-view-all"
                    onClick={() => setActiveTab("audits")}
                  >
                    View All ({audits.length}) →
                  </button>
                </div>

                {audits.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", fontSize: "12px" }}>
                    No scrap lifting audits submitted yet. Log in as Indus Field Auditor to submit first audit.
                  </div>
                ) : (
                  <div className="admin-table-container" style={{ border: "none", borderRadius: 0 }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Pass ID</th>
                          <th>Tower Site / Warehouse</th>
                          <th>Vendor & Truck</th>
                          <th>Asset Particulars</th>
                          <th>Net Weight</th>
                          <th>Live Photos</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audits.slice(0, 5).map(audit => (
                          <tr key={audit.id} className="admin-table-row">
                            <td style={{ fontFamily: "monospace", fontWeight: "700", color: "#34d399" }}>
                              #IND-{audit.id}
                            </td>
                            <td>
                              <div style={{ fontWeight: "700", color: "#ffffff" }}>{audit.site_id}</div>
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{audit.warehouse_location || audit.site_name}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: "600", color: "#ffffff" }}>{audit.vendor_name || "N/A"}</div>
                              <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#34d399", background: "rgba(16, 185, 129, 0.1)", padding: "1px 6px", borderRadius: "4px" }}>
                                {audit.vehicle_number || "N/A"}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: "11px", color: "#e2e8f0" }}>
                                {audit.asset_name || audit.scrap_category || "Steel Scrap"}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: "14px", fontWeight: "800", color: "#ffffff", fontFamily: "monospace" }}>
                                {audit.net_weight || 0}
                              </span>
                              <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "4px" }}>MT</span>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {audit.login_selfie && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage({ url: audit.login_selfie, title: `Entry Live Selfie - Site ${audit.site_id}`, gps: audit.login_gps, time: audit.login_time })}
                                    className="btn-action-small"
                                    title="View Entry Selfie"
                                    style={{ padding: "3px 8px", fontSize: "10px" }}
                                  >
                                    <Camera size={11} /> Entry
                                  </button>
                                )}
                                {audit.exit_selfie && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage({ url: audit.exit_selfie, title: `Exit Live Selfie - Site ${audit.site_id}`, gps: audit.exit_gps, time: audit.exit_time })}
                                    className="btn-action-small"
                                    title="View Exit Selfie"
                                    style={{ padding: "3px 8px", fontSize: "10px", borderColor: "rgba(245, 158, 11, 0.3)", color: "#fbbf24", background: "rgba(245, 158, 11, 0.1)" }}
                                  >
                                    <Camera size={11} /> Exit
                                  </button>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`status-chip ${(audit.audit_status || 'submitted').toLowerCase()}`}>
                                <span className="chip-dot" />
                                <span>{audit.audit_status || "SUBMITTED"}</span>
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAudit(audit);
                                  setReviewStatus(audit.audit_status || "APPROVED");
                                  setReviewRemarks(audit.admin_remarks || "");
                                }}
                                className="btn-review-mini"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AUDITS & SCRAP GATE-PASSES */}
          {activeTab === "audits" && (
            <div>
              {/* Filter Bar */}
              <div className="admin-filter-bar">
                <div className="search-box">
                  <Search size={15} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by DO No, Lot No, Vendor, Vehicle No, Site..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery("")} className="btn-clear-search">✕</button>
                  )}
                </div>

                <div className="filter-selects-group">
                  <div className="filter-select-wrap">
                    <Filter size={13} className="text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="SUBMITTED">Pending Verification</option>
                      <option value="APPROVED">Approved Gate-Pass</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div className="filter-select-wrap">
                    <Package size={13} className="text-slate-400" />
                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                    >
                      <option value="ALL">All Scrap Categories</option>
                      <option value="Tower Galvanized Steel Structure">Tower Galvanized Steel Structure</option>
                      <option value="Tower Steel Scrap">Tower Steel Scrap</option>
                      <option value="Lead-Acid Battery Banks">Lead-Acid Battery Banks</option>
                      <option value="DG Gensets & Alternators">DG Gensets & Alternators</option>
                      <option value="Copper Feeder Cables">Copper Feeder Cables</option>
                      <option value="Power Plants / SMPS">Power Plants / SMPS</option>
                      <option value="Transformers & E-Waste">Transformers & E-Waste</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    className="btn-action-small"
                    title="Refresh from Database"
                  >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    <span>Sync</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportAllAuditsExcel(filteredAudits)}
                    className="btn-action-small"
                    style={{ background: "#10b981", color: "#040805", border: "none", fontWeight: "700" }}
                    title="Export All Filtered Audits to Excel Spreadsheet"
                  >
                    <Download size={13} />
                    <span>Export to Excel (.xls)</span>
                  </button>
                </div>
              </div>

              {/* Full Audits Table */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Pass ID</th>
                      <th>Date & Time</th>
                      <th>Warehouse / DO Details</th>
                      <th>Vendor & Vehicle</th>
                      <th>Driver Info</th>
                      <th>Weight (MT)</th>
                      <th>Auditor</th>
                      <th>Live Photos</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudits.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
                          No matching scrap lifting records found.
                        </td>
                      </tr>
                    ) : (
                      filteredAudits.map(audit => (
                        <tr key={audit.id} className="admin-table-row">
                          <td style={{ fontFamily: "monospace", fontWeight: "700", color: "#34d399" }}>
                            #IND-{audit.id}
                          </td>
                          <td style={{ fontSize: "11px", color: "#94a3b8" }}>
                            <div>{new Date(audit.created_at).toLocaleDateString()}</div>
                            <div style={{ color: "#64748b", fontFamily: "monospace" }}>
                              {new Date(audit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: "700", color: "#ffffff" }}>{audit.site_id}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{audit.warehouse_location || audit.site_name}</div>
                            <div style={{ fontSize: "10px", color: "#34d399", fontFamily: "monospace" }}>
                              LOT: {audit.lot_no || "N/A"}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: "600", color: "#ffffff" }}>{audit.vendor_name || "N/A"}</div>
                            <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#34d399", background: "rgba(16, 185, 129, 0.1)", padding: "1px 6px", borderRadius: "4px" }}>
                              {audit.vehicle_number || "N/A"}
                            </span>
                          </td>
                          <td>
                            <div style={{ color: "#f8fafc" }}>{audit.driver_name || "N/A"}</div>
                            <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>{audit.driver_phone || "N/A"}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: "14px", fontWeight: "800", color: "#ffffff", fontFamily: "monospace" }}>
                              {audit.net_weight || 0} <span style={{ fontSize: "11px", color: "#fbbf24" }}>MT</span>
                            </div>
                            <div style={{ fontSize: "10px", color: "#64748b" }}>
                              Slip: <span style={{ fontFamily: "monospace", color: "#cbd5e1" }}>{audit.weighbridge_slip_no || "N/A"}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: "600", color: "#e2e8f0" }}>{audit.auditor_name}</div>
                            <div style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748b" }}>{audit.employee_code}</div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {audit.login_selfie && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({ url: audit.login_selfie, title: `Entry Selfie - Site ${audit.site_id}`, gps: audit.login_gps, time: audit.login_time })}
                                  className="btn-action-small"
                                  style={{ padding: "4px 8px", fontSize: "10px" }}
                                  title="View Entry Live Selfie"
                                >
                                  <Camera size={12} /> Entry
                                </button>
                              )}
                              {audit.exit_selfie && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({ url: audit.exit_selfie, title: `Exit Selfie - Site ${audit.site_id}`, gps: audit.exit_gps, time: audit.exit_time })}
                                  className="btn-action-small"
                                  style={{ padding: "4px 8px", fontSize: "10px", borderColor: "rgba(245, 158, 11, 0.3)", color: "#fbbf24", background: "rgba(245, 158, 11, 0.1)" }}
                                  title="View Exit Live Selfie"
                                >
                                  <Camera size={12} /> Exit
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`status-chip ${(audit.audit_status || 'submitted').toLowerCase()}`}>
                              <span className="chip-dot" />
                              <span>{audit.audit_status || "SUBMITTED"}</span>
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                              {audit.audit_status !== "APPROVED" && (
                                <button
                                  type="button"
                                  onClick={() => handleReviewSubmit("APPROVED", audit)}
                                  className="btn-action-small"
                                  style={{
                                    height: "26px",
                                    padding: "0 8px",
                                    fontSize: "10px",
                                    background: "#10b981",
                                    color: "#040805",
                                    border: "none",
                                    fontWeight: "800",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                  title="1-Click Approve Gate-Pass"
                                >
                                  <Check size={12} /> Approve
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAudit(audit);
                                  setReviewStatus(audit.audit_status || "APPROVED");
                                  setReviewRemarks(audit.admin_remarks || "");
                                }}
                                className="btn-review-mini"
                              >
                                Review
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAudit(audit.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#64748b",
                                  cursor: "pointer",
                                  padding: "4px"
                                }}
                                title="Delete Record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INDUS AUDITORS */}
          {activeTab === "auditors" && (
            <div className="admin-panel-card">
              <div className="panel-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Users size={16} className="text-emerald-400" />
                  <h3>Indus Towers Scrap Field Auditors</h3>
                </div>
                <span className="admin-tab-count">
                  {auditors.length} Active Auditors
                </span>
              </div>

              <div className="admin-table-container" style={{ border: "none", borderRadius: 0 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Auditor Name</th>
                      <th>Employee ID</th>
                      <th>Email</th>
                      <th>Assigned Circle / State</th>
                      <th>Portal Scope</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditors.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                          No auditors registered for Indus Scrap Lifting yet.
                        </td>
                      </tr>
                    ) : (
                      auditors.map(aud => (
                        <tr key={aud.id} className="admin-table-row">
                          <td style={{ fontWeight: "700", color: "#ffffff" }}>{aud.full_name}</td>
                          <td style={{ fontFamily: "monospace", color: "#34d399", fontWeight: "700" }}>{aud.employee_code}</td>
                          <td style={{ color: "#cbd5e1" }}>{aud.email}</td>
                          <td style={{ color: "#94a3b8" }}>{aud.assigned_state || "Delhi NCR"}</td>
                          <td>
                            <span className="status-chip approved">
                              INDUS SCRAP
                            </span>
                          </td>
                          <td>
                            <span className="status-chip active">
                              <span className="chip-dot" />
                              <span>{aud.account_status || "ACTIVE"}</span>
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
        </main>
      </div>

      {/* MODAL: REVIEW SCRAP AUDIT (ALL 20 MICROSOFT FORM FIELDS) */}
      {selectedAudit && (
        <div className="modal-backdrop" onClick={() => setSelectedAudit(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: "760px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={18} className="text-emerald-400" />
                <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#ffffff", margin: 0 }}>
                  Review Scrap Gate-Pass #{selectedAudit.id} • DO: {selectedAudit.do_no || selectedAudit.site_id}
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => handleExportSingleAuditExcel(selectedAudit)}
                  style={{
                    height: "32px",
                    padding: "0 14px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    border: "none",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  title="Download complete 20-field audit spreadsheet"
                >
                  <FileSpreadsheet size={13} />
                  <span>Download Excel Sheet (.xls)</span>
                  <Download size={12} />
                </button>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setSelectedAudit(null)}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
              {/* Card 1: Warehouse & Asset Info */}
              <div style={{ background: "#080d09", padding: "14px", borderRadius: "10px", border: "1px solid #1c2e22" }}>
                <div style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#34d399", letterSpacing: "0.5px", marginBottom: "10px" }}>
                  1. Warehouse & Asset Particulars
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Warehouse Location</span>
                    <strong style={{ color: "#ffffff" }}>{selectedAudit.warehouse_location || selectedAudit.site_name || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Asset Name</span>
                    <strong style={{ color: "#ffffff" }}>{selectedAudit.asset_name || selectedAudit.scrap_category || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Lot No.</span>
                    <strong style={{ color: "#34d399", fontFamily: "monospace" }}>{selectedAudit.lot_no || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Auction No.</span>
                    <strong style={{ color: "#ffffff", fontFamily: "monospace" }}>{selectedAudit.auction_no || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Auction Date</span>
                    <strong style={{ color: "#cbd5e1" }}>{selectedAudit.auction_date || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>90% Payment Date</span>
                    <strong style={{ color: "#cbd5e1" }}>{selectedAudit.ninety_percent_date || "N/A"}</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Delivery Order (DO) Details */}
              <div style={{ background: "#080d09", padding: "14px", borderRadius: "10px", border: "1px solid #1c2e22" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#60a5fa", letterSpacing: "0.5px" }}>
                    2. Delivery Order (DO) Details
                  </span>
                  <span className="status-chip in_progress" style={{ fontSize: "10px" }}>
                    {selectedAudit.do_status || "New DO"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>DO No.</span>
                    <strong style={{ color: "#ffffff", fontFamily: "monospace" }}>{selectedAudit.do_no || selectedAudit.site_id || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>DO Date</span>
                    <strong style={{ color: "#cbd5e1" }}>{selectedAudit.do_date || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Last Delivery Date</span>
                    <strong style={{ color: "#cbd5e1" }}>{selectedAudit.last_delivery_date || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Total DO Quantity</span>
                    <strong style={{ color: "#34d399", fontFamily: "monospace" }}>{selectedAudit.total_quantity || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>DO Value (₹)</span>
                    <strong style={{ color: "#ffffff", fontFamily: "monospace" }}>₹ {selectedAudit.do_value || "N/A"}</strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Invoice & Financial Details */}
              <div style={{ background: "#080d09", padding: "14px", borderRadius: "10px", border: "1px solid #1c2e22" }}>
                <div style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#fbbf24", letterSpacing: "0.5px", marginBottom: "10px" }}>
                  3. Invoice & Financial Details
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Invoice No.</span>
                    <strong style={{ color: "#ffffff", fontFamily: "monospace" }}>{selectedAudit.invoice_no || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Invoice Date</span>
                    <strong style={{ color: "#cbd5e1" }}>{selectedAudit.invoice_date || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Transaction No. (UTR)</span>
                    <strong style={{ color: "#ffffff", fontFamily: "monospace" }}>{selectedAudit.transaction_no || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Current Lifted Qty</span>
                    <strong style={{ color: "#fbbf24", fontFamily: "monospace" }}>{selectedAudit.quantity || `${selectedAudit.net_weight || 0} MT`}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Total Value (₹)</span>
                    <strong style={{ color: "#fbbf24", fontFamily: "monospace" }}>₹ {selectedAudit.total_value || "N/A"}</strong>
                  </div>
                </div>
              </div>

              {/* Card 4: Vendor & Transport Particulars */}
              <div style={{ background: "#080d09", padding: "14px", borderRadius: "10px", border: "1px solid #1c2e22" }}>
                <div style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#e2e8f0", letterSpacing: "0.5px", marginBottom: "10px" }}>
                  4. Vendor & Transport Particulars
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Vendor Name</span>
                    <strong style={{ color: "#ffffff" }}>{selectedAudit.vendor_name || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Vehicle / Truck No.</span>
                    <strong style={{ color: "#34d399", fontFamily: "monospace" }}>{selectedAudit.vehicle_number || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Driver Info</span>
                    <strong style={{ color: "#cbd5e1" }}>{selectedAudit.driver_name || "N/A"} ({selectedAudit.driver_phone || "N/A"})</strong>
                  </div>
                </div>
              </div>

              {/* Weighbridge Slip & Measurement */}
              <div style={{ background: "#080d09", padding: "14px", borderRadius: "10px", border: "1px solid #1c2e22" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#cbd5e1" }}>
                    Computerized Weighbridge Measurement
                  </span>
                  <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#94a3b8" }}>
                    Slip No: {selectedAudit.weighbridge_slip_no || "N/A"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", textAlign: "center" }}>
                  <div style={{ padding: "10px", background: "#0d140e", borderRadius: "8px", border: "1px solid #1a281e" }}>
                    <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>Gross Weight</span>
                    <div style={{ fontSize: "16px", fontWeight: "800", fontFamily: "monospace", color: "#ffffff", marginTop: "2px" }}>
                      {selectedAudit.gross_weight || 0} MT
                    </div>
                  </div>
                  <div style={{ padding: "10px", background: "#0d140e", borderRadius: "8px", border: "1px solid #1a281e" }}>
                    <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>Tare Weight</span>
                    <div style={{ fontSize: "16px", fontWeight: "800", fontFamily: "monospace", color: "#ffffff", marginTop: "2px" }}>
                      {selectedAudit.tare_weight || 0} MT
                    </div>
                  </div>
                  <div style={{ padding: "10px", background: "#0e2918", borderRadius: "8px", border: "1px solid #10b981" }}>
                    <span style={{ fontSize: "10px", color: "#34d399", textTransform: "uppercase", fontWeight: "800" }}>Net Scrap Weight</span>
                    <div style={{ fontSize: "18px", fontWeight: "900", fontFamily: "monospace", color: "#34d399", marginTop: "2px" }}>
                      {selectedAudit.net_weight || 0} MT
                    </div>
                  </div>
                </div>

                {/* Weighbridge Attachment Slip if present */}
                {selectedAudit.excel_file_data && (
                  <div style={{
                    marginTop: "12px",
                    paddingTop: "10px",
                    borderTop: "1px solid #1a281e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <FileText size={14} style={{ color: "#34d399" }} />
                      <span style={{ fontSize: "11px", color: "#cbd5e1" }}>
                        {selectedAudit.excel_file_name || "Weighbridge Computerized Slip Attached"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadPhoto(selectedAudit.excel_file_data, selectedAudit.excel_file_name || `Indus_Weighbridge_Slip_${selectedAudit.id}.png`)}
                      style={{
                        height: "26px",
                        padding: "0 10px",
                        background: "#16281b",
                        border: "1px solid #23472d",
                        color: "#34d399",
                        borderRadius: "5px",
                        fontSize: "10px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Download size={11} />
                      <span>Download Slip</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dual Live Selfies Review */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#080d09", padding: "12px", borderRadius: "10px", border: "1px solid #1c2e22" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#34d399", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Camera size={13} /> Entry Live Punch Selfie
                  </div>
                  {selectedAudit.login_selfie ? (
                    <div>
                      <img
                        src={selectedAudit.login_selfie}
                        alt="Entry Selfie"
                        style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px", border: "1px solid #1c2e22" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                        <div style={{ fontSize: "10px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                          GPS: {selectedAudit.login_gps || "Verified"}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadPhoto(selectedAudit.login_selfie, `Indus_GatePass_${selectedAudit.id}_Entry_Selfie.jpg`)}
                          style={{
                            height: "26px",
                            padding: "0 10px",
                            background: "#16281b",
                            border: "1px solid #23472d",
                            color: "#34d399",
                            borderRadius: "5px",
                            fontSize: "10px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <Download size={11} />
                          <span>Download Photo</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "11px", background: "#050806", borderRadius: "8px" }}>
                      No entry selfie
                    </div>
                  )}
                </div>

                <div style={{ background: "#080d09", padding: "12px", borderRadius: "10px", border: "1px solid #1c2e22" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#fbbf24", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Camera size={13} /> Exit Gate-Out Punch Selfie
                  </div>
                  {selectedAudit.exit_selfie ? (
                    <div>
                      <img
                        src={selectedAudit.exit_selfie}
                        alt="Exit Selfie"
                        style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px", border: "1px solid #1c2e22" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                        <div style={{ fontSize: "10px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                          GPS: {selectedAudit.exit_gps || "Verified"}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadPhoto(selectedAudit.exit_selfie, `Indus_GatePass_${selectedAudit.id}_Exit_Selfie.jpg`)}
                          style={{
                            height: "26px",
                            padding: "0 10px",
                            background: "#16281b",
                            border: "1px solid #23472d",
                            color: "#fbbf24",
                            borderRadius: "5px",
                            fontSize: "10px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <Download size={11} />
                          <span>Download Photo</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "11px", background: "#050806", borderRadius: "8px" }}>
                      No exit selfie
                    </div>
                  )}
                </div>
              </div>

              {/* Review Decision Controls */}
              <div style={{ paddingTop: "12px", borderTop: "1px solid #1c2e22" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#cbd5e1", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>
                  Admin Verification Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weighbridge MT confirmed, DO particulars verified, Gate-Pass authorized."
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  style={{
                    width: "100%",
                    height: "40px",
                    background: "#060a07",
                    border: "1px solid #1c2e22",
                    borderRadius: "8px",
                    padding: "0 12px",
                    color: "#ffffff",
                    fontSize: "12px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                  <button
                    type="button"
                    onClick={() => handleReviewSubmit("REJECTED")}
                    style={{
                      height: "38px",
                      padding: "0 16px",
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#f87171",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    Reject & Re-weigh
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewSubmit("APPROVED")}
                    className="btn-action-small"
                    style={{ height: "38px", padding: "0 22px", fontSize: "12px", background: "#10b981", color: "#040805", border: "none", fontWeight: "800", cursor: "pointer" }}
                  >
                    ✓ Approve Scrap Gate-Pass
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL PREVIEW IMAGE MODAL */}
      {previewImage && (
        <div className="modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", margin: 0 }}>
                  {previewImage.title}
                </h3>
                <div style={{ fontSize: "11px", color: "#34d399", fontFamily: "monospace", marginTop: "2px" }}>
                  {previewImage.gps}
                </div>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setPreviewImage(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "16px", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={previewImage.url}
                alt="Preview"
                style={{ maxHeight: "70vh", maxWidth: "100%", objectFit: "contain", borderRadius: "8px" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
