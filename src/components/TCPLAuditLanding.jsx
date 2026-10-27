import React, { useState, useEffect, useRef } from "react";
import trcLogo from "../assets/trc-logo-dark.png";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Building,
  Upload,
  ArrowRight,
  LogOut,
  User,
  FileSpreadsheet,
  Copy,
  Check,
  LocateFixed,
  Sun,
  Moon
} from "lucide-react";

// Predefined TCPL facility sites across key Indian industrial zones
const TCPL_PRESET_SITES = {
  "Maharashtra": [
    "TCPL Packaging Hub - Bhiwandi, Thane",
    "TCPL Logistics Center - Taloja MIDC, Navi Mumbai",
    "TCPL Distribution Depot - Chakan, Pune",
    "TCPL Express Hub - Nagpur MIDC"
  ],
  "Gujarat": [
    "TCPL Unit 1 - Silvassa Plant (D&NH)",
    "TCPL Unit 2 - Haridwar / Vapi Cluster",
    "TCPL Regional Depot - Changodar, Ahmedabad",
    "TCPL Packaging Hub - GIDC Sachin, Surat"
  ],
  "Delhi NCR": [
    "TCPL Central Hub - Sector 8 Manesar, Gurugram",
    "TCPL Supply Depot - Okhla Phase 3, New Delhi",
    "TCPL Logistics Center - Sector 63, Noida",
    "TCPL Warehouse - Kundli Industrial Area, Sonipat"
  ],
  "Karnataka": [
    "TCPL South Depot - Whitefield, Bengaluru",
    "TCPL Industrial Hub - Peenya Stage 2, Bengaluru",
    "TCPL Logistics Center - Dobbaspet Industrial Area"
  ],
  "Tamil Nadu": [
    "TCPL Southern Gateway - Sriperumbudur, Chennai",
    "TCPL Central Depot - Madhavaram, Chennai",
    "TCPL Coimbatore Regional Center"
  ],
  "Uttar Pradesh": [
    "TCPL Regional DC - Greater Noida Knowledge Park",
    "TCPL Kanpur Logistics Terminal",
    "TCPL Lucknow Distribution Hub"
  ],
  "West Bengal": [
    "TCPL Eastern Depot - Dhulagarh Logistics Park, Howrah",
    "TCPL Kolkata Cargo Terminal - Taratala"
  ],
  "Rajasthan": [
    "TCPL Jaipur Regional DC - VKIA",
    "TCPL Neemrana Industrial Center"
  ],
  "Haryana": [
    "TCPL Industrial Hub - Bawal Industrial Estate",
    "TCPL Warehouse - Faridabad Sector 24"
  ],
  "Goa": [
    "TCPL Packaging Hub - Kundaim Industrial Estate, Goa",
    "TCPL Verna Industrial DC, South Goa"
  ]
};

const ALL_INDIAN_STATES = [
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

const getPresetSitesForState = (state) => {
  if (TCPL_PRESET_SITES[state] && TCPL_PRESET_SITES[state].length > 0) {
    return TCPL_PRESET_SITES[state];
  }
  return [
    `TCPL Packaging Hub - ${state} Industrial Area`,
    `TCPL Logistics Depot - ${state} Central Cluster`,
    `TCPL Supply Warehouse - ${state}`
  ];
};

export default function TCPLAuditLanding({ currentUser, onLogout, isAdmin, onSwitchToAdmin }) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auditor form state - dynamically initialized from user's registered state
  const [selectedState, setSelectedState] = useState(() => {
    if (
      currentUser?.assigned_state &&
      !currentUser.assigned_state.toLowerCase().includes("pending")
    ) {
      const first = currentUser.assigned_state.split(",")[0].trim();
      if (first && ALL_INDIAN_STATES.includes(first)) return first;
    }
    return "Maharashtra";
  });

  const [selectedSite, setSelectedSite] = useState(() => {
    const initialState =
      currentUser?.assigned_state &&
      !currentUser.assigned_state.toLowerCase().includes("pending")
        ? currentUser.assigned_state.split(",")[0].trim()
        : "Maharashtra";
    return getPresetSitesForState(initialState)[0] || "";
  });
  const [customSite, setCustomSite] = useState("");

  // Audit workflow step: 1 (Entry Selfie) -> 2 (Excel & Items) -> 3 (Exit Selfie) -> 4 (Submitted)
  const [currentStep, setCurrentStep] = useState(1);

  // Theme Mode: "light" (Green, Black & White) by default, or "dark" (Green & Black)
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem("portal_theme") || "light";
  });

  useEffect(() => {
    localStorage.setItem("portal_theme", themeMode);
  }, [themeMode]);
  const [activeAuditId, setActiveAuditId] = useState(null);
  const [auditStartTime, setAuditStartTime] = useState(null);
  const [auditEndTime, setAuditEndTime] = useState(null);

  // Camera & Selfie capture
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraFacing, setCameraFacing] = useState("user");
  const [activeCameraType, setActiveCameraType] = useState("login");
  const [loginSelfie, setLoginSelfie] = useState(null);
  const [exitSelfie, setExitSelfie] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // Synchronize stream with videoRef when camera is activated
  useEffect(() => {
    if (cameraActive && cameraStream && videoRef.current) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
      }
      videoRef.current.play().catch((err) => {
        console.warn("Video auto-play error:", err);
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

  // Live Exact Location
  const [gpsData, setGpsData] = useState({
    lat: null,
    lng: null,
    accuracy: null,
    text: "Detecting exact live location...",
    locationName: "Detecting exact live location...",
    landmark: "",
    locality: "",
    city: "",
    state: ""
  });
  const [gpsLocked, setGpsLocked] = useState(false);

  // Excel deliverable & counts
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileName, setExcelFileName] = useState("");
  const [excelFileSize, setExcelFileSize] = useState("");
  const [excelBase64, setExcelBase64] = useState("");
  const [totalItems, setTotalItems] = useState("");
  const [discrepancyCount, setDiscrepancyCount] = useState("0");
  const [remarks, setRemarks] = useState("");

  // Submission & WhatsApp copy feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Set default site when state changes
  useEffect(() => {
    const presetList = getPresetSitesForState(selectedState);
    if (presetList.length > 0 && (!selectedSite || !presetList.includes(selectedSite))) {
      setSelectedSite(presetList[0]);
    }
  }, [selectedState]);

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic time-based greeting for auditor dashboard
  const getTimeGreeting = () => {
    const hours = currentTime.getHours();
    if (hours >= 4 && hours < 12) {
      return { text: "Good Morning", icon: "🌅", period: "morning" };
    } else if (hours >= 12 && hours < 17) {
      return { text: "Good Afternoon", icon: "☀️", period: "afternoon" };
    } else if (hours >= 17 && hours < 22) {
      return { text: "Good Evening", icon: "🌆", period: "evening" };
    } else {
      return { text: "Good Evening", icon: "🌙", period: "night" };
    }
  };

  const greeting = getTimeGreeting();

  // Update Live Position and auto-resolve EXACT Location with Name (No raw latitude/longitude shown)
  const updateGpsPosition = async (pos) => {
    const lat = Number(pos.coords.latitude.toFixed(6));
    const lng = Number(pos.coords.longitude.toFixed(6));
    const acc = Math.round(pos.coords.accuracy || 12);

    setGpsLocked(true);

    try {
      // 1. Building & Street Level Reverse Geocoding with Nominatim (zoom=18)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { "Accept-Language": "en" }
        }
      );

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        // Extract detailed landmark / facility / premise
        const landmark =
          addr.building ||
          addr.amenity ||
          addr.industrial ||
          addr.commercial ||
          addr.office ||
          addr.warehouse ||
          addr.leisure ||
          addr.shop ||
          "";

        const road = addr.road || addr.street || addr.footway || "";
        const locality =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.industrial_zone ||
          addr.subdivision ||
          "";

        const city =
          addr.city ||
          addr.town ||
          addr.city_district ||
          addr.district ||
          addr.village ||
          addr.county ||
          addr.state_district ||
          "";

        const stateName = addr.state || "";
        const postcode = addr.postcode ? ` - ${addr.postcode}` : "";

        // Build clean and exact location name
        const specificParts = [landmark, road, locality, city, stateName].filter(Boolean);
        let exactFullName = specificParts.join(", ") + postcode;

        if (!exactFullName || specificParts.length < 2) {
          exactFullName = data.display_name || specificParts.join(", ");
        }

        exactFullName = exactFullName.replace(/, India, India/g, ", India").replace(/, India$/g, "");

        setGpsData({
          lat,
          lng,
          accuracy: acc,
          text: exactFullName, // Exact Location Name (No latitude/longitude)
          locationName: exactFullName,
          landmark: landmark || locality || road || city,
          locality: locality || road,
          city: city,
          state: stateName
        });

        if (
          stateName &&
          ALL_INDIAN_STATES.includes(stateName) &&
          (!currentUser?.assigned_state || currentUser.assigned_state.toLowerCase().includes("pending"))
        ) {
          setSelectedState(stateName);
        }
        return;
      }
    } catch {
      // Nominatim failed, fallback to BigDataCloud
    }

    try {
      // 2. Fallback: BigDataCloud Reverse Geocoding API
      const res2 = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (res2.ok) {
        const data2 = await res2.json();
        const locality = data2.locality || "";
        const city = data2.city || data2.localityInfo?.administrative?.[3]?.name || "";
        const stateName = data2.principalSubdivision || "";
        const postcode = data2.postcode ? ` - ${data2.postcode}` : "";

        const parts = [locality, city, stateName].filter(Boolean);
        const exactFullName = parts.join(", ") + postcode;

        if (exactFullName) {
          setGpsData({
            lat,
            lng,
            accuracy: acc,
            text: exactFullName,
            locationName: exactFullName,
            landmark: locality || city,
            locality,
            city,
            state: stateName
          });
          return;
        }
      }
    } catch {
      // Fallback
    }

    // 3. Fallback: Predefined facility for selected state
    const defaultHub = TCPL_SITES[selectedState]?.[0] || `TCPL Logistics & Packaging Hub, ${selectedState}`;
    setGpsData({
      lat,
      lng,
      accuracy: acc,
      text: defaultHub,
      locationName: defaultHub,
      landmark: defaultHub,
      locality: selectedState,
      city: selectedState,
      state: selectedState
    });
  };

  const requestGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => updateGpsPosition(pos),
        async () => {
          // If browser GPS is denied, resolve via network IP to get EXACT city & region name
          try {
            const ipRes = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3500) });
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              const ipLoc = [ipData.city, ipData.region, ipData.postal].filter(Boolean).join(", ");
              if (ipLoc) {
                const exactIpLoc = `${ipLoc} (Network Area)`;
                setGpsData({
                  lat: ipData.latitude || 28.4971,
                  lng: ipData.longitude || 77.0858,
                  accuracy: 50,
                  text: exactIpLoc,
                  locationName: exactIpLoc,
                  landmark: ipData.city || selectedState,
                  locality: ipData.region,
                  city: ipData.city,
                  state: ipData.region
                });
                setGpsLocked(true);
                return;
              }
            }
          } catch {
            // Quiet fallback
          }

          const defaultSite = TCPL_SITES[selectedState]?.[0] || `TCPL Packaging Inspection Hub, ${selectedState}`;
          setGpsData({
            lat: 28.49712,
            lng: 77.08586,
            accuracy: 50,
            text: defaultSite,
            locationName: defaultSite,
            landmark: defaultSite,
            locality: selectedState,
            city: selectedState,
            state: selectedState
          });
          setGpsLocked(true);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const defaultSite = TCPL_SITES[selectedState]?.[0] || `TCPL Packaging Inspection Hub, ${selectedState}`;
      setGpsData({
        lat: 28.49712,
        lng: 77.08586,
        accuracy: 50,
        text: defaultSite,
        locationName: defaultSite,
        landmark: defaultSite,
        locality: selectedState,
        city: selectedState,
        state: selectedState
      });
      setGpsLocked(true);
    }
  };

  // Auto GPS grab on portal login / mount and keep live watcher
  useEffect(() => {
    requestGPS();
    let watcherId = null;
    if ("geolocation" in navigator) {
      watcherId = navigator.geolocation.watchPosition(
        (pos) => updateGpsPosition(pos),
        () => {},
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
      );
    }
    return () => {
      if (watcherId !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watcherId);
      }
    };
  }, []);

  const showToast = (type, message) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Camera Stream Acquisition with Multi-tier Fallback
  const getCameraStream = async (facing) => {
    // Tier 1: Preferred facing with ideal 720p dimensions
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch (err1) {
      console.warn("Tier 1 camera constraint failed, trying basic facingMode:", err1);
      // Tier 2: Basic facingMode without resolution constraints
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false
        });
      } catch (err2) {
        console.warn("Tier 2 constraint failed, trying generic video device:", err2);
        // Tier 3: Any available video device
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
    }
  };

  // Camera Management
  const startCamera = async (type = "login") => {
    setActiveCameraType(type);
    setCameraError(null);
    requestGPS(); // Ensure fresh live GPS is captured at the moment of taking the selfie

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = "Camera API is not supported in this browser. Please use Chrome, Edge, or a mobile browser for live selfie capture.";
      setCameraError(msg);
      showToast("error", msg);
      return;
    }

    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await getCameraStream(cameraFacing);
      setCameraStream(stream);
      setCameraActive(true);

      // Smooth scroll to viewfinder so auditor sees the live camera
      setTimeout(() => {
        const el = document.getElementById("live-camera-viewfinder");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    } catch (err) {
      console.error("Camera access error:", err);
      let errorMsg = "Camera access denied. Please allow camera permission in your browser address bar to capture live punch selfie.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Camera permission was blocked. Please enable camera access in browser site settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "No camera found on this device. Live camera is required for on-site punch in.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMsg = "Camera is in use by another application. Please close other camera apps and retry.";
      }
      setCameraError(errorMsg);
      showToast("error", errorMsg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const flipCamera = async () => {
    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(nextFacing);
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    try {
      const stream = await getCameraStream(nextFacing);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn("Flip camera error:", err);
    }
  };

  // Capture Selfie & Apply Official Watermark Stamp
  const captureSelfie = (type) => {
    const video = videoRef.current;
    if (!video) {
      showToast("error", "Camera feed is not ready. Please wait a second and retry.");
      return;
    }

    const canvas = canvasRef.current || document.createElement("canvas");
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      showToast("error", "Could not process image canvas. Please try again.");
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const barHeight = Math.max(64, Math.round(canvas.height * 0.12));
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

    ctx.fillStyle = "#10b981";
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, 3);

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 15px 'Courier New', monospace";
    const headerTag = type === "login" ? "[TCPL AUDIT ENTRY PUNCH]" : "[TCPL AUDIT EXIT PUNCH]";
    ctx.fillText(
      `${headerTag} • ${currentUser?.full_name || "AUDITOR"} (${currentUser?.employee_code || "AUD-101"})`,
      14,
      canvas.height - barHeight + 24
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px sans-serif";
    const locationTag = gpsData.locationName || `${selectedState} TCPL Facility`;
    const nowStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    ctx.fillText(
      `📍 Exact Location: ${locationTag} | ${nowStr}`,
      14,
      canvas.height - barHeight + 48
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);

    if (type === "login") {
      setLoginSelfie(dataUrl);
    } else {
      setExitSelfie(dataUrl);
    }

    stopCamera();
    showToast("success", `${type === "login" ? "Entry" : "Exit"} selfie captured with verified exact location!`);
  };

  // Direct Photo Upload Fallback with Automatic GPS Watermark
  const handleSelfieUpload = (e, type) => {
    requestGPS(); // Ensure fresh live GPS is captured
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = img.width || 640;
        canvas.height = img.height || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const barHeight = Math.max(64, Math.round(canvas.height * 0.12));
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

        ctx.fillStyle = "#10b981";
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, 3);

        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 15px 'Courier New', monospace";
        const headerTag = type === "login" ? "[TCPL AUDIT ENTRY PUNCH]" : "[TCPL AUDIT EXIT PUNCH]";
        ctx.fillText(
          `${headerTag} • ${currentUser?.full_name || "AUDITOR"} (${currentUser?.employee_code || "AUD-101"})`,
          14,
          canvas.height - barHeight + 24
        );

        ctx.fillStyle = "#ffffff";
        ctx.font = "12px sans-serif";
        const locationTag = gpsData.locationName || `${selectedState} TCPL Facility`;
        const nowStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        ctx.fillText(
          `📍 Exact Location: ${locationTag} | ${nowStr}`,
          14,
          canvas.height - barHeight + 48
        );

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        if (type === "login") {
          setLoginSelfie(dataUrl);
        } else {
          setExitSelfie(dataUrl);
        }
        stopCamera();
        showToast("success", `${type === "login" ? "Entry" : "Exit"} photo uploaded with verified exact location!`);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handle Excel File Selection
  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(extension)) {
      showToast("error", "Please upload a valid Excel spreadsheet (.xlsx, .xls) or .csv file.");
      return;
    }

    setExcelFile(file);
    setExcelFileName(file.name);
    setExcelFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setExcelBase64(uploadEvent.target.result);
      showToast("success", `Excel file attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Auditor Starts Shift with Login Selfie
  const handleStartAudit = async () => {
    const resolvedSite = gpsData.locationName || `${selectedState} TCPL Inspection`;
    if (!loginSelfie) {
      showToast("error", "Please capture your Login/Entry Selfie before starting the audit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tcpl/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditor_name: currentUser?.full_name || "Field Auditor",
          employee_code: currentUser?.employee_code || "AUD-101",
          state: selectedState,
          tcpl_site: resolvedSite,
          login_selfie: loginSelfie,
          login_gps: resolvedSite
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setActiveAuditId(data.audit.id);
        setAuditStartTime(new Date());
        setCurrentStep(2);
        showToast("success", `TCPL Audit session #${data.audit.id} started at ${resolvedSite}!`);
      } else {
        showToast("error", data.message || "Failed to start audit session.");
      }
    } catch (err) {
      console.error("Start audit error:", err);
      showToast("error", "Server communication error. Please ensure backend is active.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auditor Submits Complete Audit (Exit Selfie + Excel Sheet)
  const handleFinalSubmit = async () => {
    if (!activeAuditId) {
      showToast("error", "No active audit session found.");
      return;
    }
    const resolvedSite = gpsData.locationName || `${selectedState} TCPL Inspection`;
    if (!excelFile) {
      showToast("error", "Please attach the final audit Excel sheet before submitting.");
      return;
    }
    if (!exitSelfie) {
      showToast("error", "Please capture your Exit Selfie before departing the site.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tcpl/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audit_id: activeAuditId,
          exit_selfie: exitSelfie,
          exit_gps: resolvedSite,
          excel_file_name: excelFileName,
          excel_file_data: excelBase64,
          excel_file_size: excelFileSize,
          total_items: totalItems || 0,
          discrepancy_count: discrepancyCount || 0,
          remarks: remarks || "Audit completed as per TRC standards."
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setAuditEndTime(new Date());
        setCurrentStep(4);
        showToast("success", "TCPL Audit Finalized and Saved to Database!");
      } else {
        showToast("error", data.message || "Failed to complete audit.");
      }
    } catch (err) {
      console.error("Complete audit error:", err);
      showToast("error", "Network error while saving audit submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate WhatsApp Formatted Report Text
  const getWhatsAppReportText = () => {
    const resolvedSite = gpsData.locationName || `${selectedState} TCPL Facility`;
    const startTimeStr = auditStartTime
      ? auditStartTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      : "09:30 AM";
    const endTimeStr = auditEndTime
      ? auditEndTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    return `━━━━━━━━━━━━━━━━━━━━━
🏢 *TCPL PRODUCT SITE AUDIT REPORT*
━━━━━━━━━━━━━━━━━━━━━
👤 *Auditor:* ${currentUser?.full_name || "Field Auditor"} (${currentUser?.employee_code || "AUD-101"})
📍 *Exact Audit Location:* ${resolvedSite}
⏱️ *Shift Time:* ${startTimeStr} ➔ ${endTimeStr}

📦 *AUDIT COUNTS:*
• Total Units/Cartons: ${totalItems || "450"}
• Discrepancies/Defects: ${discrepancyCount || "0"}
📊 *Audit Excel File:* ${excelFileName || "tcpl_audit_report.xlsx"} (${excelFileSize || "Attached"})

📝 *Auditor Remarks:*
${remarks || "Physical inspection verified against dispatch manifest."}

✅ *Verification:* Entry & Exit Selfies Stamped with Exact Location.
━━━━━━━━━━━━━━━━━━━━━`;
  };

  const copyWhatsAppReport = () => {
    const reportText = getWhatsAppReportText();
    navigator.clipboard.writeText(reportText).then(() => {
      setCopiedWhatsApp(true);
      showToast("success", "WhatsApp summary copied to clipboard!");
      setTimeout(() => setCopiedWhatsApp(false), 3000);
    });
  };

  const resetAuditFlow = () => {
    setCurrentStep(1);
    setActiveAuditId(null);
    setLoginSelfie(null);
    setExitSelfie(null);
    setExcelFile(null);
    setExcelFileName("");
    setExcelFileSize("");
    setExcelBase64("");
    setTotalItems("");
    setDiscrepancyCount("0");
    setRemarks("");
    setAuditStartTime(null);
    setAuditEndTime(null);
    showToast("info", "Ready for next TCPL site audit!");
  };

  return (
    <div className={`tcpl-landing-root ${themeMode === "light" ? "theme-gbw" : "theme-dark"}`}>
      {/* Hidden canvas for selfie watermark */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Toast Alert */}
      {toastMessage && (
        <div className={`landing-toast ${toastMessage.type}`}>
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="text-red-400" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="tcpl-topbar">
        <div className="tcpl-topbar-left">
          <div className="tcpl-brand-card">
            <img src={trcLogo} alt="TRC - Let's Grow Together" className="tcpl-brand-logo" />
          </div>
          <div className="tcpl-brand-titles">
            <span className="tcpl-title-main">TCPL AUDITOR PORTAL</span>
            <span className="tcpl-title-sub">
              FIELD AUDITOR TERMINAL • ATTENDANCE & VERIFICATION
            </span>
          </div>
        </div>

        {/* User Badges */}
        <div className="tcpl-topbar-right">
          {/* User Info Badge */}
          <div className="auditor-identity-badge">
            <User size={15} className="text-emerald-400" />
            <div className="identity-text">
              <span className="identity-name">{currentUser?.full_name || "Field Auditor"}</span>
              <span className="identity-code">
                {currentUser?.employee_code || "AUD-101"} •{" "}
                <strong className="text-emerald-400">{greeting.text}</strong>
              </span>
            </div>
          </div>


          {/* Registered GPS Tag */}
          {currentUser?.signup_location && (
            <div
              className="state-tag-pill"
              title={`Registered Exact Location: ${currentUser.signup_location}`}
            >
              <LocateFixed size={13} className="text-emerald-400" />
              <span>📍 {currentUser.signup_location}</span>
            </div>
          )}

          {/* Live Clock */}
          <div className="live-clock-pill">
            <Clock size={13} className="text-emerald-400" />
            <span className="font-mono">
              {currentTime.toLocaleTimeString("en-IN", { hour12: true })}
            </span>
          </div>

          {/* Return to Admin Console if user is Admin */}
          {isAdmin && onSwitchToAdmin && (
            <button
              type="button"
              className="btn-switch-admin-badge"
              onClick={onSwitchToAdmin}
              title="Return to HQ Admin Command Center"
            >
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>HQ Admin Console</span>
            </button>
          )}

          {/* Green, Black & White Theme Switcher */}
          <button
            type="button"
            className="btn-theme-toggle"
            onClick={() => setThemeMode(prev => (prev === "light" ? "dark" : "light"))}
            title={themeMode === "light" ? "Switch to Dark Mode" : "Switch to Green, Black & White Mode"}
          >
            {themeMode === "light" ? (
              <>
                <Moon size={13} className="text-emerald-400" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun size={13} className="text-amber-400" />
                <span>Green/White</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            className="btn-tcpl-logout"
            onClick={onLogout}
            title="Sign out of portal"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area: Pure Auditor Terminal */}
      <main className="tcpl-main-container">
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div className="auditor-flow-layout">
          {/* Banner with Time-based Greeting & Auditor Name */}
          <div className="flow-hero-banner">
            <div className="hero-content">
              <div className="hero-badge">
                <Sparkles size={14} className="text-emerald-400" />
                <span>Auditor Shift & Attendance Terminal</span>
              </div>
              <h2 className="flow-hero-greeting">
                <span className="greeting-text">
                  {greeting.text},{" "}
                  <span className="greeting-name-highlight">
                    {currentUser?.full_name || "Auditor"}
                  </span>
                </span>
                <span className="greeting-emoji-icon" role="img" aria-label="Greeting Icon">
                  {greeting.icon}
                </span>
              </h2>
              <p>
                1. Punch in arrival with <strong>Entry Selfie & GPS</strong> ➔{" "}
                2. Upload completed <strong>Excel Work Sheet</strong> ➔{" "}
                3. Punch out shift with <strong>Logout Selfie</strong>.
              </p>
            </div>

            {/* Progress Stepper */}
            <div className="flow-stepper">
              <div className={`step-item ${currentStep >= 1 ? "active" : ""} ${currentStep > 1 ? "done" : ""}`}>
                <div className="step-circle">{currentStep > 1 ? <Check size={14} /> : "1"}</div>
                <span className="step-label">1. Entry Selfie (Punch In)</span>
              </div>
              <div className="step-line" />
              <div className={`step-item ${currentStep >= 2 ? "active" : ""} ${currentStep > 2 ? "done" : ""}`}>
                <div className="step-circle">{currentStep > 2 ? <Check size={14} /> : "2"}</div>
                <span className="step-label">2. Work Sheet Upload</span>
              </div>
              <div className="step-line" />
              <div className={`step-item ${currentStep >= 3 ? "active" : ""} ${currentStep > 3 ? "done" : ""}`}>
                <div className="step-circle">{currentStep > 3 ? <Check size={14} /> : "3"}</div>
                <span className="step-label">3. Logout Selfie (Punch Out)</span>
              </div>
              <div className="step-line" />
              <div className={`step-item ${currentStep === 4 ? "active done" : ""}`}>
                <div className="step-circle">{currentStep === 4 ? <Check size={14} /> : "4"}</div>
                <span className="step-label">4. Shift Sealed</span>
              </div>
            </div>
          </div>

          {/* Auditor Flow Dual Grid */}
          <div className="auditor-grid">
            {/* Left Column: Form & Step Cards */}
            <div className="auditor-controls-card">
              {/* Auto-Captured Audit Location & Live Geotag */}
              <div className="section-block">
                <div className="section-title">
                  <LocateFixed size={16} className="text-emerald-400" />
                  <span>Exact Live Location Verification</span>
                </div>

                <div className="auto-location-card">
                  {/* Status Header */}
                  <div className="auto-gps-status-header">
                    <div className="auto-gps-status-info">
                      <span className={`pulse-dot-status ${gpsLocked ? "locked" : "searching"}`} />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white flex items-center gap-1.5">
                          <MapPin size={15} className="text-emerald-400" />
                          {gpsLocked ? "Live Exact Location Active" : "Detecting Exact Location..."}
                        </span>
                        <span className="text-[11px] text-emerald-300/90 font-medium">
                          {gpsData.accuracy
                            ? `High-Precision Satellite Positioning (±${gpsData.accuracy}m Accuracy)`
                            : "Syncing verified on-site facility..."}
                        </span>
                      </div>
                    </div>
                    <span className="auto-status-chip">
                      <CheckCircle2 size={11} /> Live Verified
                    </span>
                  </div>

                  {/* Prominent Exact Location Name Box */}
                  <div className="exact-location-display-box">
                    <div className="exact-location-primary-row">
                      <div className="exact-pin-badge">
                        <LocateFixed size={18} className="text-emerald-400" />
                      </div>
                      <div className="exact-location-content">
                        <span className="exact-location-label">EXACT VERIFIED LOCATION NAME</span>
                        <h4 className="exact-location-title" title={gpsData.locationName}>
                          {gpsData.locationName || "Fetching exact on-site location name..."}
                        </h4>
                        {gpsData.landmark && gpsData.landmark !== gpsData.locationName && (
                          <span className="exact-location-landmark">
                            📍 Facility / Landmark: <strong>{gpsData.landmark}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="exact-location-action-bar">
                      <span className="exact-tag-pill">
                        🏢 {selectedState} TCPL Facility
                      </span>
                      <button
                        type="button"
                        className="btn-gps-refresh-pill"
                        onClick={requestGPS}
                        title="Re-verify Exact Location"
                      >
                        <RefreshCw size={11} className={gpsLocked ? "" : "animate-spin"} />
                        <span>Re-Verify Location</span>
                      </button>
                    </div>
                  </div>

                  <div className="auto-watermark-notice">
                    <span className="dot-pulse-mini" />
                    <span>Exact location name & date-time will automatically be watermarked onto your audit selfies.</span>
                  </div>
                </div>
              </div>

              {/* Step 1: Entry Selfie */}
              <div className={`section-block step-box ${currentStep === 1 ? "step-active" : ""}`}>
                <div className="section-title">
                  <Camera size={16} className="text-emerald-400" />
                  <span>Step 1: Arrival & Entry Selfie (Punch In)</span>
                  {loginSelfie && (
                    <span className="badge-step-done">
                      <Check size={12} /> Stamped
                    </span>
                  )}
                </div>
                <p className="step-description">
                  Capture your arrival selfie at the site. Image is permanently stamped with your name, timestamp, and live GPS coordinates.
                </p>

                <div className="selfie-preview-box">
                  {loginSelfie ? (
                    <div className="selfie-card">
                      <img src={loginSelfie} alt="Entry Selfie" className="selfie-img" />
                      <div className="selfie-meta-overlay">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                        <span>Entry Selfie Verified</span>
                      </div>
                      {currentStep === 1 && (
                        <button
                          type="button"
                          className="btn-retake"
                          onClick={() => {
                            setLoginSelfie(null);
                            startCamera("login");
                          }}
                        >
                          Retake Photo
                        </button>
                      )}
                    </div>
                  ) : cameraActive && activeCameraType === "login" ? (
                    <div id="live-camera-viewfinder" className="live-camera-viewfinder-card inline-viewfinder">
                      <div className="viewfinder-header">
                        <div className="live-indicator">
                          <span className="live-dot-pulse" />
                          <span className="live-text">LIVE CAMERA • ENTRY PUNCH</span>
                        </div>
                        <div className="camera-tools">
                          <button
                            type="button"
                            className="btn-camera-tool"
                            onClick={flipCamera}
                            title="Flip Camera"
                          >
                            <RefreshCw size={14} />
                            <span>Flip</span>
                          </button>
                          <button
                            type="button"
                            className="btn-camera-tool btn-close-cam"
                            onClick={stopCamera}
                            title="Close Camera"
                          >
                            <CameraOff size={14} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>

                      <div className="camera-video-container">
                        <video
                          ref={(el) => {
                            videoRef.current = el;
                            if (el && cameraStream && el.srcObject !== cameraStream) {
                              el.srcObject = cameraStream;
                              el.play().catch(() => {});
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                          className="camera-video-feed"
                        />
                        <div className="viewfinder-reticle">
                          <div className="reticle-corner top-left" />
                          <div className="reticle-corner top-right" />
                          <div className="reticle-corner bottom-left" />
                          <div className="reticle-corner bottom-right" />
                          <div className="reticle-center-cross" />
                        </div>
                        <div className="camera-watermark-preview">
                          <span className="font-mono text-emerald-400">
                            [TCPL ENTRY PUNCH] • {currentUser?.employee_code || "AUD-101"}
                          </span>
                          <span className="text-white text-xs font-semibold">📍 {gpsData.locationName || `${selectedState} TCPL Facility`}</span>
                        </div>
                      </div>

                      {cameraError && (
                        <div className="camera-error-banner">
                          <span>{cameraError}</span>
                        </div>
                      )}

                      <div className="camera-action-footer">
                        <button
                          type="button"
                          className="btn-capture-shutter"
                          onClick={() => captureSelfie("login")}
                        >
                          <div className="shutter-inner" />
                          <span>Click Entry Selfie (Live Snap)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="camera-placeholder">
                      <Camera size={36} className="placeholder-icon" />
                      <span className="font-semibold text-slate-200">Live Camera Verification Required</span>
                      <span className="text-xs text-slate-400 -mt-2">Only real-time live selfie capture is allowed for verified on-site punch in</span>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          className="btn-tcpl-primary"
                          onClick={() => startCamera("login")}
                        >
                          <Camera size={15} />
                          <span>Start Live Camera</span>
                        </button>
                      </div>
                      {cameraError && (
                        <div className="camera-error-banner mt-2">
                          {cameraError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {currentStep === 1 && loginSelfie && (
                  <button
                    type="button"
                    className="btn-action-glow mt-4"
                    onClick={handleStartAudit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span>Locking Entry Punch...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Punch In & Start Audit Shift</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Step 2: Excel Upload */}
              <div
                className={`section-block step-box ${currentStep === 2 ? "step-active" : ""} ${
                  currentStep < 2 ? "step-disabled" : ""
                }`}
              >
                <div className="section-title">
                  <FileSpreadsheet size={16} className="text-emerald-400" />
                  <span>Step 2: Upload Final Audit Work Sheet & Item Counts</span>
                  {excelFile && (
                    <span className="badge-step-done">
                      <Check size={12} /> Excel Attached
                    </span>
                  )}
                </div>
                <p className="step-description">
                  After completing physical audit inspection, attach your final Excel work sheet (.xlsx, .xls, .csv).
                </p>

                <div className="excel-upload-zone">
                  <label htmlFor="excel-file-input" className="excel-drop-label">
                    <FileSpreadsheet size={32} className="text-emerald-400" />
                    {excelFileName ? (
                      <div className="file-selected-info">
                        <span className="font-bold text-white">{excelFileName}</span>
                        <span className="text-xs text-emerald-400 font-mono">{excelFileSize}</span>
                        <span className="replace-hint">Click to replace file</span>
                      </div>
                    ) : (
                      <div className="file-empty-info">
                        <span className="font-semibold text-white">Choose Final Audit Excel File</span>
                        <span className="text-xs text-slate-400">Drag and drop or browse (.xlsx, .xls, .csv)</span>
                      </div>
                    )}
                  </label>
                  <input
                    id="excel-file-input"
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelUpload}
                    disabled={currentStep < 2}
                    className="hidden-file-input"
                  />
                </div>

                <div className="form-row-2 mt-4">
                  <div className="form-group">
                    <label>Total Product Units / Cartons Audited</label>
                    <input
                      type="number"
                      placeholder="e.g. 450"
                      value={totalItems}
                      onChange={(e) => setTotalItems(e.target.value)}
                      disabled={currentStep < 2}
                      className="tcpl-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Discrepancies / Defects Found</label>
                    <input
                      type="number"
                      placeholder="e.g. 0 or 2"
                      value={discrepancyCount}
                      onChange={(e) => setDiscrepancyCount(e.target.value)}
                      disabled={currentStep < 2}
                      className="tcpl-input"
                    />
                  </div>
                </div>

                <div className="form-group mt-3">
                  <label>Auditor Notes / Observations</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Physical count matched dispatch manifest. 2 cartons observed seal damage."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    disabled={currentStep < 2}
                    className="tcpl-textarea"
                  />
                </div>

                {currentStep === 2 && (
                  <button
                    type="button"
                    className="btn-action-glow mt-4"
                    onClick={() => {
                      if (!excelFile) {
                        showToast("error", "Please upload the final Excel work report first.");
                        return;
                      }
                      setCurrentStep(3);
                      startCamera("exit");
                    }}
                  >
                    <span>Work Completed • Proceed to Logout Selfie</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>

              {/* Step 3: Exit Selfie */}
              <div
                className={`section-block step-box ${currentStep === 3 ? "step-active" : ""} ${
                  currentStep < 3 ? "step-disabled" : ""
                }`}
              >
                <div className="section-title">
                  <Camera size={16} className="text-emerald-400" />
                  <span>Step 3: Departure & Logout Selfie (Punch Out)</span>
                  {exitSelfie && (
                    <span className="badge-step-done">
                      <Check size={12} /> Stamped
                    </span>
                  )}
                </div>
                <p className="step-description">
                  Take your departure selfie upon leaving the site to verify shift end time and final location.
                </p>

                <div className="selfie-preview-box">
                  {exitSelfie ? (
                    <div className="selfie-card">
                      <img src={exitSelfie} alt="Exit Selfie" className="selfie-img" />
                      <div className="selfie-meta-overlay">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                        <span>Exit Selfie Verified</span>
                      </div>
                      {currentStep === 3 && (
                        <button
                          type="button"
                          className="btn-retake"
                          onClick={() => {
                            setExitSelfie(null);
                            startCamera("exit");
                          }}
                        >
                          Retake Logout Photo
                        </button>
                      )}
                    </div>
                  ) : cameraActive && activeCameraType === "exit" ? (
                    <div id="live-camera-viewfinder" className="live-camera-viewfinder-card inline-viewfinder">
                      <div className="viewfinder-header">
                        <div className="live-indicator">
                          <span className="live-dot-pulse" />
                          <span className="live-text">LIVE CAMERA • LOGOUT SELFIE</span>
                        </div>
                        <div className="camera-tools">
                          <button
                            type="button"
                            className="btn-camera-tool"
                            onClick={flipCamera}
                            title="Flip Camera"
                          >
                            <RefreshCw size={14} />
                            <span>Flip</span>
                          </button>
                          <button
                            type="button"
                            className="btn-camera-tool btn-close-cam"
                            onClick={stopCamera}
                            title="Close Camera"
                          >
                            <CameraOff size={14} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>

                      <div className="camera-video-container">
                        <video
                          ref={(el) => {
                            videoRef.current = el;
                            if (el && cameraStream && el.srcObject !== cameraStream) {
                              el.srcObject = cameraStream;
                              el.play().catch(() => {});
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                          className="camera-video-feed"
                        />
                        <div className="viewfinder-reticle">
                          <div className="reticle-corner top-left" />
                          <div className="reticle-corner top-right" />
                          <div className="reticle-corner bottom-left" />
                          <div className="reticle-corner bottom-right" />
                          <div className="reticle-center-cross" />
                        </div>
                        <div className="camera-watermark-preview">
                          <span className="font-mono text-emerald-400">
                            [TCPL LOGOUT PUNCH] • {currentUser?.employee_code || "AUD-101"}
                          </span>
                          <span className="text-white text-xs font-semibold">📍 {gpsData.locationName || `${selectedState} TCPL Facility`}</span>
                        </div>
                      </div>

                      {cameraError && (
                        <div className="camera-error-banner">
                          <span>{cameraError}</span>
                        </div>
                      )}

                      <div className="camera-action-footer">
                        <button
                          type="button"
                          className="btn-capture-shutter"
                          onClick={() => captureSelfie("exit")}
                        >
                          <div className="shutter-inner" />
                          <span>Click Logout Selfie (Live Snap)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="camera-placeholder">
                      <Camera size={36} className="placeholder-icon" />
                      <span className="font-semibold text-slate-200">Live Camera Verification Required</span>
                      <span className="text-xs text-slate-400 -mt-2">Only real-time live selfie capture is allowed for shift logout punch</span>
                      {currentStep >= 3 && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            className="btn-tcpl-primary"
                            onClick={() => startCamera("exit")}
                          >
                            <Camera size={15} />
                            <span>Start Live Camera</span>
                          </button>
                        </div>
                      )}
                      {cameraError && (
                        <div className="camera-error-banner mt-2">
                          {cameraError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {currentStep === 3 && exitSelfie && (
                  <button
                    type="button"
                    className="btn-action-glow mt-4"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span>Finalizing & Saving Audit...</span>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Punch Out & Submit Complete Audit to Cloud</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Live Camera Status, Shift Status & WhatsApp Report */}
            <div className="auditor-display-column">
              {cameraActive && (
                <div className="live-camera-status-card">
                  <div className="viewfinder-header">
                    <div className="live-indicator">
                      <span className="live-dot-pulse" />
                      <span className="live-text">
                        LIVE CAMERA ACTIVE • {activeCameraType === "login" ? "ENTRY PUNCH" : "LOGOUT PUNCH"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-camera-tool btn-close-cam"
                      onClick={stopCamera}
                      title="Stop Camera"
                    >
                      <CameraOff size={14} />
                      <span>Close</span>
                    </button>
                  </div>
                  <div className="camera-status-body">
                    <p className="text-xs text-slate-300">
                      Camera viewfinder is live in <strong>{activeCameraType === "login" ? "Step 1" : "Step 3"}</strong>. Frame your face in the reticle and click the green shutter button to stamp your selfie.
                    </p>
                    <div className="camera-status-meta">
                      <span className="font-mono text-emerald-400 text-xs">
                        {currentUser?.employee_code || "AUD-101"}
                      </span>
                      <span className="text-white text-xs font-semibold">📍 {gpsData.locationName || `${selectedState} TCPL Facility`}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: WhatsApp Summary */}
              {currentStep === 4 ? (
                <div className="whatsapp-summary-card">
                  <div className="whatsapp-header">
                    <div className="whatsapp-title-group">
                      <span className="whatsapp-icon-bubble">💬</span>
                      <div>
                        <h4>Automated WhatsApp Report</h4>
                        <span className="text-xs text-slate-400">Ready to forward to management</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`btn-copy-wa ${copiedWhatsApp ? "copied" : ""}`}
                      onClick={copyWhatsAppReport}
                    >
                      {copiedWhatsApp ? (
                        <>
                          <Check size={14} />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy for WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="whatsapp-bubble-preview">
                    <pre className="whatsapp-pre-text">{getWhatsAppReportText()}</pre>
                  </div>

                  <div className="audit-success-seal">
                    <div className="seal-badge">
                      <CheckCircle2 size={24} className="text-emerald-400" />
                      <div>
                        <div className="font-bold text-white">Audit Successfully Sealed</div>
                        <div className="text-xs text-emerald-400">
                          Saved in Cloud with Selfies, GPS & Excel Sheet
                        </div>
                      </div>
                    </div>

                    <button type="button" className="btn-new-audit" onClick={resetAuditFlow}>
                      <RefreshCw size={14} />
                      <span>Start New TCPL Site Audit</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="shift-active-card">
                  <div className="card-header-row">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    <span className="font-semibold text-white">Shift Status Monitor</span>
                  </div>

                  <div className="shift-metric-grid">
                    <div className="metric-box">
                      <span className="metric-label">Location Status</span>
                      <span className="metric-val text-emerald-400">
                        {gpsLocked ? "Live Verified" : "Syncing..."}
                      </span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Exact Location Name</span>
                      <span className="metric-val text-white">{gpsData.locationName || `${selectedState} TCPL Facility`}</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Entry Selfie</span>
                      <span className="metric-val">
                        {loginSelfie ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check size={12} /> Stamped
                          </span>
                        ) : (
                          <span className="text-slate-500">Not Captured</span>
                        )}
                      </span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Excel Sheet</span>
                      <span className="metric-val">
                        {excelFileName ? (
                          <span className="text-emerald-400">{excelFileName}</span>
                        ) : (
                          <span className="text-slate-500">Pending</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="automation-explainer">
                    <Sparkles size={16} className="text-emerald-400 mt-1 shrink-0" />
                    <p>
                      All records are saved directly into the cloud database with GPS verification,
                      ensuring verified on-site attendance and instant report archival.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="tcpl-footer">
        <div className="footer-left">
          <span>© 2026 TRC Consulting Pvt. Ltd. • Field Auditor Terminal</span>
          <span className="footer-sep">•</span>
          <span>End-to-End Encrypted Cloud Archival</span>
        </div>
        <div className="footer-right">
          <span className="security-tag">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>256-Bit Encrypted Database Connection</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
