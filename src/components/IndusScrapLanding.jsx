import React, { useState, useEffect, useRef } from "react";
import trcLogo from "../assets/trc-logo-dark.png";
import {
  ShieldCheck,
  Camera,
  MapPin,
  Clock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Building,
  Calendar,
  FileText,
  Truck,
  Scale,
  FileSpreadsheet,
  Share2,
  RotateCcw,
  Check,
  ChevronRight,
  User,
  Phone,
  ArrowRight,
  RefreshCw,
  Download
} from "lucide-react";

export default function IndusScrapLanding({ currentUser, onLogout, isAdmin, onSwitchToAdmin }) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Greeting helper
  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours < 12) return { text: "Good Morning", icon: "🌅" };
    if (hours < 17) return { text: "Good Afternoon", icon: "☀️" };
    return { text: "Good Evening", icon: "🌙" };
  };

  // Workflow steps: 1 (Warehouse & Asset) -> 2 (DO & Invoice) -> 3 (Vehicle & Weighbridge) -> 4 (Gate-Pass Issued)
  const [currentStep, setCurrentStep] = useState(1);

  // -------------------------------------------------------------
  // INDUS REPORTS MICROSOFT FORM FIELDS
  // -------------------------------------------------------------

  // Section 1: Auditor & Warehouse Details
  const [auditorName, setAuditorName] = useState(() => currentUser?.full_name || "");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [assetName, setAssetName] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [auctionNo, setAuctionNo] = useState("");
  const [auctionDate, setAuctionDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [ninetyPercentDate, setNinetyPercentDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Section 2: Delivery Orders (DO) & Invoice Details
  const [doStatus, setDoStatus] = useState("New DO"); // "New DO" | "Existing DO"
  const [doNo, setDoNo] = useState("");
  const [doDate, setDoDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [lastDeliveryDate, setLastDeliveryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [totalQuantity, setTotalQuantity] = useState("");
  const [doValue, setDoValue] = useState("");

  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [transactionNo, setTransactionNo] = useState("");
  const [quantity, setQuantity] = useState("");
  const [totalValue, setTotalValue] = useState("");

  // Section 3: Vendor, Vehicle & Weighbridge Details
  const [vendorName, setVendorName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [weighbridgeSlipNo, setWeighbridgeSlipNo] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [tareWeight, setTareWeight] = useState("");
  const [netWeight, setNetWeight] = useState("0.00");

  // Excel / Weighbridge Manifest
  const [excelFileName, setExcelFileName] = useState("");
  const [excelFileData, setExcelFileData] = useState("");

  // Live Camera (Strict Camera Only, No File Upload for Selfie)
  const [cameraActive, setCameraActive] = useState(false);
  const [activeCameraType, setActiveCameraType] = useState("entry"); // "entry" | "exit"
  const [cameraFacing, setCameraFacing] = useState("user");
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const [entrySelfie, setEntrySelfie] = useState(null);
  const [exitSelfie, setExitSelfie] = useState(null);

  // Exact Live GPS Location (Street, Sector, Landmark & PIN Precision)
  const [isResolvingGps, setIsResolvingGps] = useState(false);
  const [gpsData, setGpsData] = useState({
    lat: null,
    lng: null,
    accuracy: null,
    locationName: "Acquiring live GPS address..."
  });

  // Submission state
  const [submittedAudit, setSubmittedAudit] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Auto calculate net weight
  useEffect(() => {
    const g = parseFloat(grossWeight) || 0;
    const t = parseFloat(tareWeight) || 0;
    if (g >= t) {
      const net = (g - t).toFixed(2);
      setNetWeight(net);
      setQuantity(`${net} MT`);
    } else {
      setNetWeight("0.00");
    }
  }, [grossWeight, tareWeight]);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // High-Precision Reverse Geocoding: resolves exact Building, Street, Sector, Area & PIN Code
  const resolveExactLocation = async (lat, lng) => {
    setIsResolvingGps(true);

    // 1. OpenStreetMap Nominatim with zoom=18 (Exact Building / Street Level Precision)
    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (osmRes.ok) {
        const data = await osmRes.json();
        const addr = data.address || {};

        // Extract high-detail physical location parts
        const landmark = addr.building || addr.amenity || addr.office || addr.commercial || addr.industrial || addr.leisure || "";
        const street = [addr.house_number, addr.road || addr.street || addr.footway || addr.path].filter(Boolean).join(" ");
        const subArea = addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || addr.city_block || addr.subdistrict || "";
        const cityArea = addr.city || addr.town || addr.village || addr.municipality || addr.city_district || addr.county || "";
        const stateArea = addr.state || "";
        const pincode = addr.postcode ? `${addr.postcode}` : "";

        const parts = [
          landmark,
          street,
          subArea,
          cityArea,
          [stateArea, pincode].filter(Boolean).join(" - ")
        ].filter(Boolean);

        if (parts.length >= 2) {
          const exactFormatted = parts.join(", ");
          setGpsData(prev => ({
            ...prev,
            locationName: exactFormatted
          }));
          setIsResolvingGps(false);
          return;
        } else if (data.display_name) {
          const cleaned = data.display_name.replace(/, India$/, "").trim();
          setGpsData(prev => ({
            ...prev,
            locationName: cleaned
          }));
          setIsResolvingGps(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Nominatim exact geocode error:", e);
    }

    // 2. BigDataCloud Granular Reverse Geocoding Client (Fast client-side fallback)
    try {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (bdcRes.ok) {
        const d = await bdcRes.json();
        const road = d.localityInfo?.informative?.find(i => i.description === "road" || i.description === "street")?.name || "";
        const sector = d.localityInfo?.informative?.find(i => i.description?.includes("subdivision") || i.order === 8)?.name || "";
        const locality = d.locality || d.city || d.subLocality || "";
        const state = d.principalSubdivision || "";
        const post = d.postcode ? ` - ${d.postcode}` : "";

        const parts = [road, sector, locality, `${state}${post}`].filter(Boolean);
        if (parts.length >= 2) {
          setGpsData(prev => ({
            ...prev,
            locationName: parts.join(", ")
          }));
          setIsResolvingGps(false);
          return;
        }
      }
    } catch (e) {
      console.warn("BigDataCloud exact geocode error:", e);
    }

    setIsResolvingGps(false);
  };

  // Trigger GPS acquisition and exact address resolution
  const refreshGPS = () => {
    if (!("geolocation" in navigator)) {
      showToast("error", "Geolocation is not supported in this browser");
      return;
    }
    setIsResolvingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));
        const acc = Math.round(pos.coords.accuracy || 15);
        setGpsData(prev => ({
          ...prev,
          lat,
          lng,
          accuracy: acc
        }));
        resolveExactLocation(lat, lng);
        showToast("success", "Live GPS exact location updated!");
      },
      (err) => {
        setIsResolvingGps(false);
        console.warn("GPS acquire error:", err);
        showToast("error", "Could not get live GPS. Please enable device location.");
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 0 }
    );
  };

  // Initial Auto GPS grab on load
  useEffect(() => {
    refreshGPS();
  }, []);

  const showToast = (type, message) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synchronize camera stream with videoRef whenever modal opens or stream updates
  useEffect(() => {
    if (cameraActive && cameraStream && videoRef.current) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
      }
      videoRef.current.play().catch((err) => {
        console.warn("Video auto-play warning:", err);
      });
    }
  }, [cameraActive, cameraStream]);

  // Clean up media tracks when unmounting or stopping camera
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Camera Management
  const startCamera = async (type) => {
    setActiveCameraType(type);
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = "Camera API is not supported in this browser. Please use Chrome, Edge, or Firefox.";
      setCameraError(msg);
      showToast("error", msg);
      return;
    }

    try {
      // First attempt: try requested facingMode
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setCameraStream(stream);
      setCameraActive(true);
    } catch (err) {
      console.warn("Requested facingMode failed, falling back to standard video:", err);
      // Fallback: try basic video: true without strict constraints (compatible with PC/laptop webcams)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(stream);
        setCameraActive(true);
      } catch (err2) {
        console.error("Camera permission or hardware error:", err2);
        const errorText = "Camera permission denied or camera not found. Please click the camera icon in your browser URL address bar and choose 'Allow'.";
        setCameraError(errorText);
        showToast("error", "Camera access denied. Please allow camera permissions in browser.");
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const flipCamera = async () => {
    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(nextFacing);
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false
      });
      setCameraStream(stream);
    } catch (err) {
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(fallback);
      } catch (e) {
        console.warn("Flip camera error:", e);
      }
    }
  };

  // Capture Live Selfie with Official Indus Reports Watermark
  const captureSelfie = (type) => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Official Indus Reports Watermark Bar
    const barHeight = Math.max(72, Math.round(canvas.height * 0.15));
    ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

    ctx.fillStyle = "#10b981";
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, 3);

    ctx.fillStyle = "#34d399";
    ctx.font = "bold 14px 'Courier New', monospace";
    const tag = type === "entry" ? "[INDUS REPORTS - ENTRY LIVE PUNCH]" : "[INDUS REPORTS - EXIT GATE-OUT PUNCH]";
    ctx.fillText(tag, 14, canvas.height - barHeight + 20);

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px 'Segoe UI', sans-serif";
    const line1 = `DO: ${doNo || 'N/A'} • Lot: ${lotNo || 'N/A'} • Truck: ${vehicleNumber || 'N/A'} • Auditor: ${auditorName}`;
    ctx.fillText(line1, 14, canvas.height - barHeight + 40);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px 'Courier New', monospace";
    const line2 = `EXACT LOC: ${gpsData.locationName} (${gpsData.lat}°N, ${gpsData.lng}°E) | ${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}`;
    ctx.fillText(line2, 14, canvas.height - barHeight + 58);

    const base64Data = canvas.toDataURL("image/jpeg", 0.92);
    if (type === "entry") {
      setEntrySelfie(base64Data);
      showToast("success", "Entry Live Selfie captured with GPS watermark!");
    } else {
      setExitSelfie(base64Data);
      showToast("success", "Exit Live Selfie captured with GPS watermark!");
    }

    stopCamera();
  };

  // Upload manifest
  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setExcelFileData(event.target.result);
      showToast("success", `Attached manifest: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Submit Audit to Backend
  const handleSubmitAudit = async () => {
    if (!entrySelfie) {
      showToast("error", "Please capture Entry Live Selfie in Section 1 first");
      setCurrentStep(1);
      return;
    }
    if (!doNo.trim() || !vehicleNumber.trim() || !lotNo.trim()) {
      showToast("error", "DO No, Lot No, and Vehicle Number are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        auditor_name: auditorName.trim(),
        employee_code: currentUser?.employee_code || "AUD-INDUS-201",
        state: currentUser?.assigned_state || "Delhi NCR",
        site_id: doNo.trim(),
        site_name: warehouseLocation.trim(),
        warehouse_location: warehouseLocation.trim(),
        asset_name: assetName.trim(),
        lot_no: lotNo.trim(),
        auction_no: auctionNo.trim(),
        auction_date: auctionDate,
        ninety_percent_date: ninetyPercentDate,
        do_no: doNo.trim(),
        do_status: doStatus,
        do_date: doDate,
        last_delivery_date: lastDeliveryDate,
        total_quantity: totalQuantity.trim(),
        quantity: quantity.trim(),
        do_value: doValue.trim(),
        total_value: totalValue.trim(),
        invoice_no: invoiceNo.trim(),
        invoice_date: invoiceDate,
        transaction_no: transactionNo.trim(),
        vendor_name: vendorName.trim(),
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        driver_name: driverName.trim(),
        driver_phone: driverPhone.trim(),
        scrap_category: assetName.trim(),
        weighbridge_slip_no: weighbridgeSlipNo.trim(),
        gross_weight: parseFloat(grossWeight) || 0,
        tare_weight: parseFloat(tareWeight) || 0,
        net_weight: parseFloat(netWeight) || 0,
        weight_unit: "MT",
        excel_file_data: excelFileData,
        excel_file_name: excelFileName,
        login_selfie: entrySelfie,
        login_gps: gpsData.locationName,
        exit_selfie: exitSelfie || entrySelfie,
        exit_gps: gpsData.locationName,
      };

      const res = await fetch(`${API_BASE_URL}/indus/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmittedAudit(data.audit);
        setCurrentStep(4);
        showToast("success", "Indus Report & Gate-Pass generated successfully!");
      } else {
        showToast("error", data.message || "Failed to submit report");
      }
    } catch (err) {
      console.error("Submit error:", err);
      showToast("error", "Connection error. Make sure backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  // WhatsApp manifest generator formatted with all Indus Reports details
  const getWhatsAppMessage = () => {
    const text = `*INDUS REPORTS - FIELD DISPATCH MANIFEST* 🏗️
=================================
*Report / Gate-Pass ID:* #IND-${submittedAudit?.id || 'NEW'}
*Date & Time:* ${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}
*Auditor Name:* ${auditorName} (${currentUser?.employee_code || 'AUD-INDUS-201'})
*Warehouse Location:* ${warehouseLocation}
---------------------------------
*AUCTION & ASSET DETAILS:*
• Asset Name: ${assetName}
• Lot No.: ${lotNo}
• Auction No.: ${auctionNo}
• Auction Date: ${auctionDate}
• 90% Payment Date: ${ninetyPercentDate}
---------------------------------
*DELIVERY ORDER (DO) DETAILS:*
• DO Status: ${doStatus}
• DO No.: ${doNo}
• DO Date: ${doDate}
• Last Delivery Date: ${lastDeliveryDate}
• Total DO Quantity: ${totalQuantity}
• DO Value: ₹ ${doValue}
---------------------------------
*INVOICE & FINANCIAL DETAILS:*
• Invoice No.: ${invoiceNo || 'N/A'}
• Invoice Date: ${invoiceDate}
• Transaction No. (UTR): ${transactionNo || 'N/A'}
• Current Lifted Quantity: ${quantity}
• Total Value: ₹ ${totalValue}
---------------------------------
*VENDOR & VEHICLE LIFTING:*
• Vendor Name: ${vendorName}
• Vehicle No.: ${vehicleNumber}
• Driver: ${driverName} (${driverPhone})
• Weighbridge Slip: ${weighbridgeSlipNo}
• Gross: ${grossWeight} MT | Tare: ${tareWeight} MT
• *NET LIFTED WEIGHT:* *${netWeight} MT*
---------------------------------
*Live Location:* ${gpsData.locationName}
=================================`;
    return encodeURIComponent(text);
  };

  // Helper to trigger direct file/photo download
  const handleDownloadPhoto = (dataUrl, filename) => {
    if (!dataUrl) {
      showToast("error", "No photo available to download");
      return;
    }
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename || "Indus_Verification_Photo.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", `Downloaded ${filename}`);
  };

  // Helper to generate and download comprehensive Microsoft Forms compliant Excel Spreadsheet
  const handleDownloadExcelReport = (auditData) => {
    const audit = auditData || submittedAudit;
    if (!audit) {
      showToast("error", "No audit data found to export");
      return;
    }

    const id = audit.id || "1";
    const passNo = `IND-${id}`;
    const timestamp = audit.created_at ? new Date(audit.created_at).toLocaleString("en-IN") : new Date().toLocaleString("en-IN");
    const auditor = audit.auditor_name || auditorName || "Indus Scrap Auditor";
    const empCode = audit.employee_code || currentUser?.employee_code || "AUD-INDUS-201";
    const email = currentUser?.email || "auditor@indus.com";
    const warehouse = audit.warehouse_location || warehouseLocation || "";
    const asset = audit.asset_name || assetName || "";
    const lot = audit.lot_no || lotNo || "";
    const auction = audit.auction_no || auctionNo || "";
    const aucDate = audit.auction_date || auctionDate || "";
    const ninetyDate = audit.ninety_percent_date || ninetyPercentDate || "";
    const doStat = audit.do_status || doStatus || "New DO";
    const doNum = audit.do_no || doNo || "";
    const doDt = audit.do_date || doDate || "";
    const lastDelDate = audit.last_delivery_date || lastDeliveryDate || "";
    const totQty = audit.total_quantity || totalQuantity || "";
    const doVal = audit.do_value || doValue || "";
    const invDt = audit.invoice_date || invoiceDate || "";
    const invNo = audit.invoice_no || invoiceNo || "";
    const txnNo = audit.transaction_no || transactionNo || "";
    const curQty = audit.quantity || quantity || `${audit.net_weight || netWeight || 0} MT`;
    const totVal = audit.total_value || totalValue || "";
    const vendor = audit.vendor_name || vendorName || "";
    const vehicle = audit.vehicle_number || vehicleNumber || "";
    const driver = audit.driver_name || driverName || "";
    const phone = audit.driver_phone || driverPhone || "";
    const slipNo = audit.weighbridge_slip_no || weighbridgeSlipNo || "";
    const gross = audit.gross_weight || grossWeight || 0;
    const tare = audit.tare_weight || tareWeight || 0;
    const net = audit.net_weight || netWeight || 0;
    const gpsIn = audit.login_gps || entryGps || gpsData?.locationName || "Verified Live";
    const gpsOut = audit.exit_gps || exitGps || gpsData?.locationName || "Verified Live";
    const entryImg = audit.login_selfie || entrySelfie;
    const exitImg = audit.exit_selfie || exitSelfie;

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
          Source Form: Indus Reports (forms.cloud.microsoft/r/dBQBDq9ki9) • Gate-Pass ID: #${passNo} • Exported: ${timestamp}
        </th>
      </tr>
      <tr><td colspan="34" style="height: 10px; border: none;"></td></tr>

      <!-- EXACT MICROSOFT FORM RESPONSES ROW-WISE HEADERS -->
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
          <td class="ms-cell">${email}</td>
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
        <td class="label-cell">Weighbridge Document:</td>
        <td class="value-cell" colspan="3">${audit.excel_file_name || excelFileName || "Computerized Slip Attached on Server"}</td>
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
    showToast("success", `Downloaded official Indus Reports Excel Sheet for Gate-Pass #${passNo}`);
  };

  const greeting = getGreeting();

  return (
    <div className="indus-landing-root">
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          padding: "12px 20px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "12px",
          fontWeight: "700",
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          background: toastMessage.type === "success" ? "#0c2514" : "#2a0e0e",
          border: `1px solid ${toastMessage.type === "success" ? "#10b981" : "#ef4444"}`,
          color: toastMessage.type === "success" ? "#34d399" : "#fca5a5"
        }}>
          {toastMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="indus-topbar">
        <div className="indus-topbar-left">
          <div className="indus-brand-badge">
            <img src={trcLogo} alt="TRC Consulting" className="indus-brand-logo" />
          </div>
          <div className="indus-title-group">
            <span className="indus-title-main">INDUS REPORTS TERMINAL</span>
            <span className="indus-title-sub">FIELD AUDITOR DISPATCH & VERIFICATION GATEWAY</span>
          </div>
        </div>

        <div className="indus-topbar-right">
          <div className="indus-auditor-pill">
            <User size={14} style={{ color: "#10b981" }} />
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff" }}>{auditorName}</span>
            <span style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace" }}>{currentUser?.employee_code || "AUD-INDUS-201"}</span>
          </div>

          <div className="indus-clock-pill">
            <Clock size={13} style={{ color: "#10b981" }} />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>

          {isAdmin && onSwitchToAdmin && (
            <button
              type="button"
              className="indus-btn-admin-switch"
              onClick={onSwitchToAdmin}
              title="Switch to Indus Admin Console"
            >
              <ShieldCheck size={14} />
              <span>Admin Console</span>
            </button>
          )}

          <button
            type="button"
            className="indus-btn-logout"
            onClick={onLogout}
            title="Secure Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="indus-main-container">
        {/* HERO GREETING & AUTO GPS */}
        <div className="indus-hero-banner">
          <div className="indus-hero-left">
            <h2>
              <span>{greeting.icon}</span>
              <span>{greeting.text},</span>
              <span style={{ color: "#34d399", fontWeight: "900" }}>{auditorName}</span>!
            </h2>
            <p>Indus Towers Scrap Lifting & Verification Gateway • Live Geofenced Shift</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
            <div className="indus-gps-pill" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(16, 185, 129, 0.14)",
              border: "1px solid #10b981",
              padding: "8px 14px",
              borderRadius: "10px",
              maxWidth: "500px"
            }}>
              <MapPin size={16} style={{ color: "#34d399", flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.6px", color: "#34d399", fontWeight: "800" }}>
                  EXACT LIVE VERIFIED ADDRESS
                </span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff", lineHeight: "1.35" }}>
                  {gpsData.locationName}
                </span>
              </div>
              <button
                type="button"
                onClick={refreshGPS}
                title="Refresh Live GPS Coordinates & Exact Address"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#34d399",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <RefreshCw size={14} className={isResolvingGps ? "animate-spin" : ""} />
              </button>
            </div>
            {gpsData.lat && (
              <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748b" }}>
                Satellite Coordinates: {gpsData.lat}° N, {gpsData.lng}° E (±{gpsData.accuracy}m)
              </span>
            )}
          </div>
        </div>

        {/* STEP PROGRESS TRACKER */}
        <div className="indus-stepper">
          <button
            type="button"
            className={`indus-step-btn ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}
            onClick={() => setCurrentStep(1)}
          >
            <Building size={15} />
            <span>1. Warehouse & Asset</span>
          </button>

          <button
            type="button"
            className={`indus-step-btn ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}
            onClick={() => setCurrentStep(2)}
          >
            <FileText size={15} />
            <span>2. DO & Invoice</span>
          </button>

          <button
            type="button"
            className={`indus-step-btn ${currentStep === 3 ? "active" : currentStep > 3 ? "completed" : ""}`}
            onClick={() => setCurrentStep(3)}
          >
            <Truck size={15} />
            <span>3. Vehicle & Weighbridge</span>
          </button>

          <button
            type="button"
            disabled={!submittedAudit}
            className={`indus-step-btn ${currentStep === 4 ? "active" : ""}`}
            onClick={() => setCurrentStep(4)}
          >
            <CheckCircle2 size={15} />
            <span>4. Gate-Pass</span>
          </button>
        </div>

        {/* SECTION 1: WAREHOUSE & ASSET DETAILS */}
        {currentStep === 1 && (
          <div className="indus-card">
            <div className="indus-card-header">
              <div>
                <h3>
                  <Building size={18} style={{ color: "#10b981" }} />
                  <span>Section 1: Warehouse & Asset Details</span>
                </h3>
                <p>Fill in warehouse location, asset information, auction dates, and capture Entry Live Camera Punch.</p>
              </div>
              <span className="indus-section-badge">PART 1 OF 3</span>
            </div>

            <div className="indus-grid-2">
              <div className="indus-field">
                <label>Auditor Name *</label>
                <div className="indus-input-wrap">
                  <User size={15} className="indus-input-icon" />
                  <input
                    type="text"
                    value={auditorName}
                    onChange={e => setAuditorName(e.target.value)}
                    placeholder="Auditor Name"
                    className="indus-input"
                  />
                </div>
              </div>

              <div className="indus-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label>Warehouse Location *</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (gpsData.locationName) {
                        setWarehouseLocation(gpsData.locationName);
                        showToast("success", "Filled with exact live location address!");
                      }
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#34d399",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0
                    }}
                  >
                    Use Live GPS Address
                  </button>
                </div>
                <div className="indus-input-wrap">
                  <MapPin size={15} className="indus-input-icon" />
                  <input
                    type="text"
                    value={warehouseLocation}
                    onChange={e => setWarehouseLocation(e.target.value)}
                    placeholder="e.g. Dwarka Sector 12, Pocket 7, South West Delhi - 110078"
                    className="indus-input"
                  />
                </div>
              </div>

              <div className="indus-field indus-col-span-2">
                <label>Asset Name *</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={assetName}
                    onChange={e => setAssetName(e.target.value)}
                    placeholder="e.g. Tower Galvanized Steel Structure / Battery Banks / DG Sets"
                    className="indus-input no-icon"
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Lot No. *</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={lotNo}
                    onChange={e => setLotNo(e.target.value.toUpperCase())}
                    placeholder="e.g. LOT-2026-DEL-089"
                    className="indus-input no-icon"
                    style={{ color: "#34d399", fontFamily: "monospace", fontWeight: "700" }}
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Auction No. *</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={auctionNo}
                    onChange={e => setAuctionNo(e.target.value.toUpperCase())}
                    placeholder="e.g. AUC/INDUS/2026/412"
                    className="indus-input no-icon"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Auction Date *</label>
                <div className="indus-input-wrap">
                  <Calendar size={15} className="indus-input-icon" />
                  <input
                    type="date"
                    value={auctionDate}
                    onChange={e => setAuctionDate(e.target.value)}
                    className="indus-input"
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>90% Date (Payment Clearance) *</label>
                <div className="indus-input-wrap">
                  <Calendar size={15} className="indus-input-icon" />
                  <input
                    type="date"
                    value={ninetyPercentDate}
                    onChange={e => setNinetyPercentDate(e.target.value)}
                    className="indus-input"
                  />
                </div>
              </div>
            </div>

            {/* MANDATORY ENTRY LIVE CAMERA PUNCH */}
            <div className="indus-camera-section">
              <div className="indus-camera-header">
                <div>
                  <div className="indus-camera-title">
                    <Camera size={15} style={{ color: "#10b981" }} />
                    <span>Auditor Entry Live Camera Punch (Strict Live Camera)</span>
                  </div>
                  <div className="indus-camera-sub">
                    Live selfie taken on site with automatic GPS coordinates, Lot No, and timestamp watermark.
                  </div>
                </div>

                {entrySelfie && (
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "#0d2616",
                    border: "1px solid #1e3827",
                    color: "#34d399",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <Check size={12} /> Captured
                  </span>
                )}
              </div>

              {entrySelfie ? (
                <div className="indus-camera-preview">
                  <img src={entrySelfie} alt="Entry Selfie" />
                  <button
                    type="button"
                    className="btn-camera-retake"
                    onClick={() => startCamera("entry")}
                  >
                    <RotateCcw size={13} /> Retake Live Photo
                  </button>
                </div>
              ) : (
                <div className="indus-camera-placeholder">
                  <Camera size={36} style={{ margin: "0 auto 10px", color: "#10b981", opacity: 0.8 }} />
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#f8fafc" }}>Live Camera Punch Required</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>Gallery file upload is disabled as per TRC Security Policy</div>
                  <button
                    type="button"
                    className="indus-btn-primary"
                    style={{ marginTop: "16px" }}
                    onClick={() => startCamera("entry")}
                  >
                    <Camera size={16} />
                    <span>Open Camera & Punch Entry</span>
                  </button>
                </div>
              )}
            </div>

            <div className="indus-footer-actions" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="indus-btn-primary"
                onClick={() => {
                  if (!entrySelfie) {
                    showToast("error", "Please capture Entry Live Selfie first");
                    return;
                  }
                  setCurrentStep(2);
                }}
              >
                <span>Continue to DO & Invoice</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: DELIVERY ORDER & INVOICE DETAILS */}
        {currentStep === 2 && (
          <div className="indus-card">
            <div className="indus-card-header">
              <div>
                <h3>
                  <FileText size={18} style={{ color: "#10b981" }} />
                  <span>Section 2: Delivery Orders (DO) & Invoice Details</span>
                </h3>
                <p>Specify DO status, delivery order quantities, values, and invoice transaction details.</p>
              </div>
              <span className="indus-section-badge">PART 2 OF 3</span>
            </div>

            {/* DO STATUS CHOICE TOGGLE */}
            <div className="indus-choice-box">
              <span className="indus-choice-box-label">Delivery Order Status *</span>
              <div className="indus-choice-toggle">
                <button
                  type="button"
                  className={`indus-choice-btn ${doStatus === "New DO" ? "active new-do" : ""}`}
                  onClick={() => setDoStatus("New DO")}
                >
                  <span className="choice-dot" />
                  <span>New DO</span>
                </button>

                <button
                  type="button"
                  className={`indus-choice-btn ${doStatus === "Existing DO" ? "active existing-do" : ""}`}
                  onClick={() => setDoStatus("Existing DO")}
                >
                  <span className="choice-dot" />
                  <span>Existing DO</span>
                </button>
              </div>
            </div>

            <div className="indus-grid-2">
              <div className="indus-field">
                <label>DO No. (Delivery Order No.) *</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={doNo}
                    onChange={e => setDoNo(e.target.value.toUpperCase())}
                    placeholder="e.g. DO/INDUS/DEL/9041"
                    className="indus-input no-icon"
                    style={{ color: "#34d399", fontFamily: "monospace", fontWeight: "700" }}
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>DO Date *</label>
                <div className="indus-input-wrap">
                  <Calendar size={15} className="indus-input-icon" />
                  <input
                    type="date"
                    value={doDate}
                    onChange={e => setDoDate(e.target.value)}
                    className="indus-input"
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Last Delivery Date *</label>
                <div className="indus-input-wrap">
                  <Calendar size={15} className="indus-input-icon" />
                  <input
                    type="date"
                    value={lastDeliveryDate}
                    onChange={e => setLastDeliveryDate(e.target.value)}
                    className="indus-input"
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Total Quantity (DO Total) *</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={totalQuantity}
                    onChange={e => setTotalQuantity(e.target.value)}
                    placeholder="e.g. 25.00 MT"
                    className="indus-input no-icon"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>DO Value (₹) *</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={doValue}
                    onChange={e => setDoValue(e.target.value)}
                    placeholder="e.g. 12,45,000"
                    className="indus-input no-icon"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Invoice Date *</label>
                <div className="indus-input-wrap">
                  <Calendar size={15} className="indus-input-icon" />
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="indus-input"
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Invoice No.</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value.toUpperCase())}
                    placeholder="e.g. INV-2026-7812"
                    className="indus-input no-icon"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Transaction No. (UTR / Bank Ref)</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={transactionNo}
                    onChange={e => setTransactionNo(e.target.value.toUpperCase())}
                    placeholder="e.g. UTR-HDFC-908234125"
                    className="indus-input no-icon"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Current Lifted Quantity (This Load)</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="e.g. 8.30 MT"
                    className="indus-input no-icon"
                    style={{ color: "#fbbf24", fontFamily: "monospace", fontWeight: "700" }}
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Total Value (₹)</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={totalValue}
                    onChange={e => setTotalValue(e.target.value)}
                    placeholder="e.g. 12,45,000"
                    className="indus-input no-icon"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </div>
            </div>

            <div className="indus-footer-actions">
              <button
                type="button"
                className="indus-btn-secondary"
                onClick={() => setCurrentStep(1)}
              >
                Back to Section 1
              </button>

              <button
                type="button"
                className="indus-btn-primary"
                onClick={() => setCurrentStep(3)}
              >
                <span>Continue to Vehicle & Weighbridge</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: VENDOR, VEHICLE & WEIGHBRIDGE */}
        {currentStep === 3 && (
          <div className="indus-card">
            <div className="indus-card-header">
              <div>
                <h3>
                  <Truck size={18} style={{ color: "#10b981" }} />
                  <span>Section 3: Vendor, Vehicle & Weighbridge Tonnage</span>
                </h3>
                <p>Record vehicle registration, computerized weighbridge weights (MT), and Exit Gate-Out Live Punch.</p>
              </div>
              <span className="indus-section-badge">PART 3 OF 3</span>
            </div>

            <div className="indus-grid-2">
              <div className="indus-field">
                <label>Vender Name (Buyer Agency) *</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={vendorName}
                    onChange={e => setVendorName(e.target.value)}
                    placeholder="e.g. Balaji Scrap Recyclers Pvt Ltd"
                    className="indus-input no-icon"
                    style={{ fontWeight: "600" }}
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Vehicle No. (Truck Number) *</label>
                <div className="indus-input-wrap">
                  <Truck size={15} className="indus-input-icon" />
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. DL-1AA-4589"
                    className="indus-input"
                    style={{ color: "#34d399", fontFamily: "monospace", fontWeight: "700" }}
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Driver Name</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="indus-input no-icon"
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Driver Mobile Phone</label>
                <div className="indus-input-wrap">
                  <Phone size={14} className="indus-input-icon" />
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={e => setDriverPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="indus-input"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div className="indus-field indus-col-span-2">
                <label>Computerized Weighbridge Slip No. *</label>
                <div className="indus-input-wrap">
                  <input
                    type="text"
                    value={weighbridgeSlipNo}
                    onChange={e => setWeighbridgeSlipNo(e.target.value.toUpperCase())}
                    placeholder="e.g. WB-2026-9042"
                    className="indus-input no-icon"
                    style={{ fontFamily: "monospace", fontWeight: "700" }}
                  />
                </div>
              </div>

              <div className="indus-field">
                <label>Gross Weight (Loaded Truck) *</label>
                <div className="indus-input-wrap">
                  <input
                    type="number"
                    step="0.01"
                    value={grossWeight}
                    onChange={e => setGrossWeight(e.target.value)}
                    placeholder="14.50"
                    className="indus-input no-icon"
                    style={{ fontFamily: "monospace", fontWeight: "700", paddingRight: "40px" }}
                  />
                  <span className="indus-input-unit">MT</span>
                </div>
              </div>

              <div className="indus-field">
                <label>Tare Weight (Empty Truck) *</label>
                <div className="indus-input-wrap">
                  <input
                    type="number"
                    step="0.01"
                    value={tareWeight}
                    onChange={e => setTareWeight(e.target.value)}
                    placeholder="6.20"
                    className="indus-input no-icon"
                    style={{ fontFamily: "monospace", fontWeight: "700", paddingRight: "40px" }}
                  />
                  <span className="indus-input-unit">MT</span>
                </div>
              </div>
            </div>

            {/* CALCULATED NET WEIGHT CARD */}
            <div className="indus-calc-display">
              <div>
                <div className="indus-calc-title">Calculated Net Scrap Weight</div>
                <div className="indus-calc-sub">Gross Loaded Weight ({grossWeight || 0} MT) − Empty Tare Weight ({tareWeight || 0} MT)</div>
              </div>
              <div className="indus-calc-number">
                {netWeight} <span style={{ fontSize: "14px", color: "#10b981", fontWeight: "700" }}>MT</span>
              </div>
            </div>

            {/* WEIGHBRIDGE ATTACHMENT */}
            <div style={{
              background: "#080e0a",
              border: "1px solid #1a2c1e",
              borderRadius: "10px",
              padding: "16px",
              margin: "18px 0"
            }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase", marginBottom: "6px" }}>
                Attach Weighbridge Slip / Excel Manifest
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "12px" }}>
                Attach the computerized weighbridge printout or Excel manifest (.xlsx, .xls, .csv, photo/PDF).
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <label style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 16px",
                  background: "#112015",
                  border: "1px solid #1e3827",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#f8fafc",
                  cursor: "pointer"
                }}>
                  <FileSpreadsheet size={15} style={{ color: "#10b981" }} />
                  <span>Choose Manifest File</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,image/*,.pdf"
                    onChange={handleExcelUpload}
                    style={{ display: "none" }}
                  />
                </label>
                {excelFileName && (
                  <span style={{ fontSize: "11px", color: "#34d399", fontFamily: "monospace" }}>
                    ✓ {excelFileName}
                  </span>
                )}
              </div>
            </div>

            {/* EXIT GATE-OUT LIVE CAMERA PUNCH */}
            <div className="indus-camera-section">
              <div className="indus-camera-header">
                <div>
                  <div className="indus-camera-title">
                    <Camera size={15} style={{ color: "#f59e0b" }} />
                    <span>Exit Gate-Out Live Camera Punch</span>
                  </div>
                  <div className="indus-camera-sub">
                    Live camera photo of the loaded truck departing the warehouse yard with DO watermark.
                  </div>
                </div>

                {exitSelfie && (
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "#261a0d",
                    border: "1px solid #4a3418",
                    color: "#fbbf24",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <Check size={12} /> Captured
                  </span>
                )}
              </div>

              {exitSelfie ? (
                <div className="indus-camera-preview">
                  <img src={exitSelfie} alt="Exit Selfie" />
                  <button
                    type="button"
                    className="btn-camera-retake"
                    onClick={() => startCamera("exit")}
                  >
                    <RotateCcw size={13} /> Retake Exit Photo
                  </button>
                </div>
              ) : (
                <div className="indus-camera-placeholder">
                  <Camera size={36} style={{ margin: "0 auto 10px", color: "#f59e0b", opacity: 0.8 }} />
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#f8fafc" }}>Exit Live Camera Punch Required</div>
                  <button
                    type="button"
                    className="indus-btn-primary"
                    style={{ marginTop: "16px", background: "#f59e0b", color: "#000000" }}
                    onClick={() => startCamera("exit")}
                  >
                    <Camera size={16} />
                    <span>Open Camera & Punch Exit</span>
                  </button>
                </div>
              )}
            </div>

            <div className="indus-footer-actions">
              <button
                type="button"
                className="indus-btn-secondary"
                onClick={() => setCurrentStep(2)}
              >
                Back to Section 2
              </button>

              <button
                type="button"
                disabled={submitting}
                className="indus-btn-primary"
                onClick={handleSubmitAudit}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Submitting Indus Report...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Submit & Generate Gate-Pass</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* SECTION 4: GATE-PASS ISSUED & WHATSAPP REPORT */}
        {currentStep === 4 && submittedAudit && (
          <div className="indus-success-card">
            <div className="indus-success-icon-wrap">
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#ffffff", margin: "0 0 6px 0" }}>
              Indus Reports Gate-Pass Issued!
            </h2>
            <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#34d399", fontWeight: "700" }}>
              OFFICIAL GATE-PASS NO: #IND-{submittedAudit.id}
            </div>
            <p style={{ fontSize: "12px", color: "#94a3b8", maxWidth: "520px", margin: "8px auto 0" }}>
              All 20 fields from the Indus Reports Microsoft Form have been validated, timestamped with live GPS, and stored in the central database.
            </p>

            {/* FULL TICKET SUMMARY */}
            <div className="indus-manifest-ticket">
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#34d399", textTransform: "uppercase", borderBottom: "1px solid #1e3325", paddingBottom: "6px" }}>
                Official Indus Report Dispatch Summary:
              </div>

              <div className="indus-ticket-grid">
                <div><span style={{ color: "#64748b" }}>AUDITOR:</span> {auditorName}</div>
                <div><span style={{ color: "#64748b" }}>WAREHOUSE:</span> {warehouseLocation}</div>
                <div><span style={{ color: "#64748b" }}>ASSET:</span> {assetName}</div>
                <div><span style={{ color: "#64748b" }}>LOT NO:</span> <strong style={{ color: "#34d399" }}>{lotNo}</strong></div>
                <div><span style={{ color: "#64748b" }}>AUCTION NO:</span> {auctionNo} ({auctionDate})</div>
                <div><span style={{ color: "#64748b" }}>90% DATE:</span> {ninetyPercentDate}</div>
                <div><span style={{ color: "#64748b" }}>DO NO:</span> <strong style={{ color: "#34d399" }}>{doNo}</strong> ({doStatus})</div>
                <div><span style={{ color: "#64748b" }}>DO DATE:</span> {doDate}</div>
                <div><span style={{ color: "#64748b" }}>TOTAL DO QTY:</span> {totalQuantity}</div>
                <div><span style={{ color: "#64748b" }}>DO VALUE:</span> ₹ {doValue}</div>
                <div><span style={{ color: "#64748b" }}>INVOICE NO:</span> {invoiceNo || 'N/A'} ({invoiceDate})</div>
                <div><span style={{ color: "#64748b" }}>UTR / TXN NO:</span> {transactionNo || 'N/A'}</div>
                <div><span style={{ color: "#64748b" }}>VENDOR:</span> {vendorName}</div>
                <div><span style={{ color: "#64748b" }}>TRUCK NO:</span> <strong style={{ color: "#34d399" }}>{vehicleNumber}</strong></div>
                <div><span style={{ color: "#64748b" }}>DRIVER:</span> {driverName} ({driverPhone})</div>
                <div><span style={{ color: "#64748b" }}>WEIGHBRIDGE SLIP:</span> {weighbridgeSlipNo}</div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "14px",
                borderTop: "1px solid #1e3325",
                marginTop: "14px",
                fontSize: "14px"
              }}>
                <span style={{ fontWeight: "800", color: "#34d399" }}>NET LIFTED TONNAGE:</span>
                <span style={{ fontSize: "22px", fontWeight: "900", color: "#ffffff", fontFamily: "monospace" }}>{netWeight} MT</span>
              </div>
            </div>

            {/* EXCEL SHEET & LIVE PHOTO DOWNLOAD CENTER */}
            <div style={{
              background: "#080f0a",
              border: "1px solid #1a3824",
              borderRadius: "14px",
              padding: "20px",
              margin: "20px auto",
              maxWidth: "600px",
              textAlign: "left"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", borderBottom: "1px solid #162e1d", paddingBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileSpreadsheet size={18} style={{ color: "#34d399" }} />
                    <span>Download Official Documents & Photos</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "3px" }}>
                    Exact Microsoft Forms row-wise format + stamped live verification photos
                  </div>
                </div>
                <span style={{ fontSize: "10px", fontWeight: "800", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "4px 8px", borderRadius: "999px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                  MS FORMS .XLS
                </span>
              </div>

              {/* 1. Main Action: Download Full Excel Sheet */}
              <button
                type="button"
                onClick={() => handleDownloadExcelReport(submittedAudit)}
                style={{
                  width: "100%",
                  height: "46px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
                  marginBottom: "16px"
                }}
              >
                <FileSpreadsheet size={18} />
                <span>Download Indus Reports Excel Sheet (.xls)</span>
                <Download size={16} />
              </button>

              {/* 2. Download Live Photos Grid */}
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: "10px" }}>
                Live Verification Photos:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Entry Selfie */}
                <div style={{ background: "#0c1710", border: "1px solid #1a3322", borderRadius: "10px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#34d399", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Camera size={13} />
                    <span>Entry Live Selfie</span>
                  </div>
                  {entrySelfie || submittedAudit?.login_selfie ? (
                    <img
                      src={entrySelfie || submittedAudit?.login_selfie}
                      alt="Entry Selfie"
                      style={{ width: "100%", height: "110px", objectFit: "cover", borderRadius: "6px", border: "1px solid #1c3d25" }}
                    />
                  ) : (
                    <div style={{ height: "110px", background: "#060a08", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "11px" }}>
                      Photo on Record
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownloadPhoto(entrySelfie || submittedAudit?.login_selfie, `Indus_GatePass_${submittedAudit?.id || 'NEW'}_Entry_Punch.jpg`)}
                    style={{
                      height: "32px",
                      background: "#16281b",
                      border: "1px solid #23472d",
                      color: "#34d399",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <Download size={13} />
                    <span>Download Photo</span>
                  </button>
                </div>

                {/* Exit Selfie */}
                <div style={{ background: "#0c1710", border: "1px solid #1a3322", borderRadius: "10px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#fbbf24", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Camera size={13} />
                    <span>Exit Gate-Out Selfie</span>
                  </div>
                  {exitSelfie || submittedAudit?.exit_selfie ? (
                    <img
                      src={exitSelfie || submittedAudit?.exit_selfie}
                      alt="Exit Selfie"
                      style={{ width: "100%", height: "110px", objectFit: "cover", borderRadius: "6px", border: "1px solid #1c3d25" }}
                    />
                  ) : (
                    <div style={{ height: "110px", background: "#060a08", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "11px" }}>
                      Photo on Record
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownloadPhoto(exitSelfie || submittedAudit?.exit_selfie || entrySelfie, `Indus_GatePass_${submittedAudit?.id || 'NEW'}_Exit_Punch.jpg`)}
                    style={{
                      height: "32px",
                      background: "#16281b",
                      border: "1px solid #23472d",
                      color: "#fbbf24",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <Download size={13} />
                    <span>Download Photo</span>
                  </button>
                </div>
              </div>

              {/* 3. Weighbridge Slip / Manifest Document if available */}
              {(excelFileData || submittedAudit?.excel_file_data) && (
                <div style={{
                  marginTop: "12px",
                  background: "#0a140d",
                  border: "1px solid #1a3322",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText size={16} style={{ color: "#34d399" }} />
                    <span style={{ fontSize: "12px", color: "#cbd5e1" }}>
                      {excelFileName || submittedAudit?.excel_file_name || "Weighbridge Manifest Document"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadPhoto(excelFileData || submittedAudit?.excel_file_data, excelFileName || `Indus_Weighbridge_Slip_${submittedAudit?.id || 'NEW'}.png`)}
                    style={{
                      height: "28px",
                      padding: "0 12px",
                      background: "#16281b",
                      border: "1px solid #23472d",
                      color: "#34d399",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    <Download size={12} />
                    <span>Download Slip</span>
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", maxWidth: "600px", margin: "0 auto" }}>
              <a
                href={`https://wa.me/?text=${getWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="indus-btn-whatsapp"
              >
                <Share2 size={16} />
                <span>Share Manifest on WhatsApp</span>
              </a>

              <button
                type="button"
                className="indus-btn-secondary"
                style={{ height: "48px", justifyContent: "center" }}
                onClick={() => {
                  setSubmittedAudit(null);
                  setEntrySelfie(null);
                  setExitSelfie(null);
                  setCurrentStep(1);
                }}
              >
                <RotateCcw size={15} />
                <span>Submit Another Indus Report</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* LIVE CAMERA MODAL OVERLAY */}
      {cameraActive && (
        <div className="indus-camera-modal-backdrop">
          <div className="indus-camera-modal">
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid #1e3827",
              background: "#0a130e"
            }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#34d399", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                <Camera size={14} />
                <span>{activeCameraType === "entry" ? "Entry Live Camera Punch" : "Exit Gate-Out Live Punch"}</span>
              </span>
              <button
                type="button"
                onClick={stopCamera}
                style={{
                  background: "#16251b",
                  border: "1px solid #233b2c",
                  color: "#cbd5e1",
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>

            <div className="indus-camera-viewfinder">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.play().catch(() => { });
                  }
                }}
              />

              {/* Camera Error Message Overlay */}
              {cameraError && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px",
                  background: "rgba(10, 15, 12, 0.96)",
                  textAlign: "center",
                  zIndex: 10
                }}>
                  <AlertTriangle size={36} style={{ color: "#ef4444", marginBottom: "12px" }} />
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>
                    Camera Access Required
                  </div>
                  <div style={{ fontSize: "11px", color: "#cbd5e1", maxWidth: "340px", lineHeight: "1.5", marginBottom: "18px" }}>
                    {cameraError}
                  </div>
                  <button
                    type="button"
                    onClick={() => startCamera(activeCameraType)}
                    className="indus-btn-primary"
                    style={{ fontSize: "12px", height: "38px" }}
                  >
                    <RefreshCw size={14} />
                    <span>Try Camera Again</span>
                  </button>
                </div>
              )}

              <div style={{
                position: "absolute",
                inset: "20px",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "12px",
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "8px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "rgba(52, 211, 153, 0.8)", fontFamily: "monospace" }}>
                  <span>DO: {doNo || 'INDUS'}</span>
                  <span>LOT: {lotNo || 'LOT'}</span>
                </div>
                <div style={{
                  textAlign: "center",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#34d399",
                  background: "rgba(0,0,0,0.65)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  alignSelf: "center"
                }}>
                  Align face & vehicle in frame
                </div>
              </div>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              background: "#080e0a"
            }}>
              <button
                type="button"
                onClick={flipCamera}
                style={{
                  background: "#121d15",
                  border: "1px solid #1e3827",
                  color: "#cbd5e1",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
                title="Flip Camera"
              >
                <RotateCcw size={16} />
              </button>

              <button
                type="button"
                onClick={() => captureSelfie(activeCameraType)}
                className="indus-btn-primary"
                style={{ borderRadius: "999px", padding: "0 28px", height: "46px" }}
              >
                <Camera size={18} />
                <span>Snap Live Photo</span>
              </button>

              <div style={{ width: "40px" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

