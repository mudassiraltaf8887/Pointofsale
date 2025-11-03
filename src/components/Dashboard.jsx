import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

// Import Components
import CategoryManager from "./MasterData/CategoryManager";
import ItemManager from "./MasterData/ItemManager";
import CustomerManager from "./MasterData/CustomerManager";
import VendorManager from "./MasterData/VendorManager";
import Sale from "./Sale";
import PurchaseManager from "./PurchaseManager";
import SaleReturnManager from "./SaleReturnManager";
import InventoryStock from "./Reports/InventoryStock";
import SaleStock from "./Reports/SaleStock";
import PurchaseReturnManager from "./PurchaseReturnManager";
import PurchaseStock from "./Reports/PurchaseStock";

const Settings = ({ currentTheme }) => (
  <div
    style={{
      padding: "40px",
      background: currentTheme.CARD_BG,
      borderRadius: "16px",
      boxShadow: currentTheme.SHADOW_MD,
      color: currentTheme.TEXT_PRIMARY,
    }}
  >
    <h2
      style={{
        fontSize: "24px",
        marginBottom: "20px",
        color: currentTheme.TEXT_PRIMARY,
      }}
    >
      System Settings
    </h2>
    <p style={{ color: currentTheme.TEXT_SECONDARY }}>
      Configuration options will appear here.
    </p>
    <button
      onClick={() => alert("Settings saved!")}
      style={{
        marginTop: "20px",
        padding: "10px 20px",
        backgroundColor: currentTheme.PRIMARY,
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      Save Settings
    </button>
  </div>
);

// THEME DEFINITIONS
const DARK_THEME = {
  PRIMARY: "#ef4444",
  PRIMARY_DARK: "#dc2626",
  PRIMARY_LIGHT: "#f87171",
  SECONDARY: "#1a1a1a",
  SIDEBAR_BG: "#0a0a0a",
  SIDEBAR_HOVER: "#1f1f1f",
  CARD_BG: "#141414",
  TEXT_PRIMARY: "#ffffff",
  TEXT_SECONDARY: "#a3a3a3",
  TEXT_MUTED: "#737373",
  ACCENT_SUCCESS: "#22c55e",
  ACCENT_WARNING: "#f59e0b",
  ACCENT_DANGER: "#ef4444",
  ACCENT_INFO: "#3b82f6",
  SHADOW_SM: "0 1px 3px rgba(0,0,0,0.3)",
  SHADOW_MD: "0 4px 12px rgba(0,0,0,0.4)",
  SHADOW_LG: "0 10px 30px rgba(0,0,0,0.5)",
  GRADIENT_PRIMARY: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  GRADIENT_SUCCESS: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
  GRADIENT_WARNING: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  GRADIENT_INFO: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  BODY_BG: "#0a0a0a",
};

const LIGHT_THEME = {
  PRIMARY: "#ef4444",
  PRIMARY_DARK: "#dc2626",
  PRIMARY_LIGHT: "#f87171",
  SECONDARY: "#f0f0f0",
  SIDEBAR_BG: "#ffffff",
  SIDEBAR_HOVER: "#f3f4f6",
  CARD_BG: "#ffffff",
  TEXT_PRIMARY: "#1f2937",
  TEXT_SECONDARY: "#4b5563",
  TEXT_MUTED: "#9ca3af",
  ACCENT_SUCCESS: "#10b981",
  ACCENT_WARNING: "#f59e0b",
  ACCENT_DANGER: "#ef4444",
  ACCENT_INFO: "#3b82f6",
  SHADOW_SM: "0 1px 3px rgba(0,0,0,0.05)",
  SHADOW_MD: "0 4px 12px rgba(0,0,0,0.1)",
  SHADOW_LG: "0 10px 30px rgba(0,0,0,0.15)",
  GRADIENT_PRIMARY: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  GRADIENT_SUCCESS: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  GRADIENT_WARNING: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  GRADIENT_INFO: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  BODY_BG: "#f3f4f6",
};

// SIDEBAR COMPONENTS
const SidebarItem = ({
  iconPath,
  text,
  active,
  onClick,
  sidebarOpen,
  accentColor,
  positionIndicator,
  isParent,
  currentTheme,
  hasDropdown,
  isOpen,
}) => {
  const isMasterDataSubItemActive = [
    "category",
    "item",
    "customer",
    "vendor",
  ].includes(active);
  const isReportsSubItemActive = ["inventoryStock", "saleStock"].includes(active);

  const itemActive =
    active === positionIndicator ||
    (isParent &&
      positionIndicator === "masterData" &&
      isMasterDataSubItemActive) ||
    (isParent && positionIndicator === "reports" && isReportsSubItemActive);

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        padding: sidebarOpen ? "14px 16px" : "14px 0",
        margin: "6px 0",
        borderRadius: "10px",
        cursor: "pointer",
        background: itemActive ? currentTheme.SIDEBAR_HOVER : "transparent",
        transition: "all 0.2s",
        justifyContent: sidebarOpen ? "space-between" : "center",
        fontWeight: itemActive ? "600" : "500",
        position: "relative",
        border: itemActive
          ? `1px solid ${accentColor}30`
          : "1px solid transparent",
        color: currentTheme.TEXT_PRIMARY,
      }}
      onMouseEnter={(e) => {
        if (!itemActive) {
          e.currentTarget.style.background = currentTheme.SIDEBAR_HOVER;
          e.currentTarget.style.border = `1px solid ${accentColor}20`;
        }
      }}
      onMouseLeave={(e) => {
        if (!itemActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.border = "1px solid transparent";
        }
      }}
    >
      {itemActive && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "4px",
            height: "60%",
            background: accentColor,
            borderRadius: "0 4px 4px 0",
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center" }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{
            flexShrink: 0,
            color: itemActive ? accentColor : currentTheme.TEXT_MUTED,
          }}
        >
          <path d={iconPath} />
        </svg>
        {sidebarOpen && (
          <span
            style={{
              marginLeft: "14px",
              fontSize: "15px",
              whiteSpace: "nowrap",
              color: itemActive
                ? currentTheme.TEXT_PRIMARY
                : currentTheme.TEXT_SECONDARY,
            }}
          >
            {text}
          </span>
        )}
      </div>
      {sidebarOpen && hasDropdown && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{
            color: currentTheme.TEXT_MUTED,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s",
          }}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      )}
    </div>
  );
};

const SidebarSubItem = ({
  iconPath,
  text,
  active,
  pageId,
  onClick,
  currentTheme,
}) => (
  <div
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      padding: "12px 16px",
      margin: "4px 0",
      borderRadius: "8px",
      cursor: "pointer",
      background:
        active === pageId ? `${currentTheme.PRIMARY}20` : "transparent",
      transition: "all 0.2s",
      fontWeight: active === pageId ? "600" : "400",
      color:
        active === pageId ? currentTheme.PRIMARY : currentTheme.TEXT_SECONDARY,
      paddingLeft: "50px",
      border:
        active === pageId
          ? `1px solid ${currentTheme.PRIMARY}40`
          : "1px solid transparent",
    }}
    onMouseEnter={(e) => {
      if (active !== pageId) {
        e.currentTarget.style.background = currentTheme.SIDEBAR_HOVER;
        e.currentTarget.style.border = `1px solid ${currentTheme.PRIMARY}20`;
      }
    }}
    onMouseLeave={(e) => {
      if (active !== pageId) {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.border = "1px solid transparent";
      }
    }}
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{
        flexShrink: 0,
        color:
          active === pageId ? currentTheme.PRIMARY : currentTheme.TEXT_MUTED,
      }}
    >
      <path d={iconPath} />
    </svg>
    <span
      style={{ marginLeft: "12px", fontSize: "14px", whiteSpace: "nowrap" }}
    >
      {text}
    </span>
  </div>
);

const reportsSubItems = [
  {
    id: "inventoryStock",
    name: "Inventory Stock",
    icon: "M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z",
  },
   {
    id: "purchaseStock",  // ⭐ NAYI ENTRY
    name: "Purchase Stock",
    icon: "M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z",
  },
  {
    id: "saleStock",
    name: "Sale Stock",
    icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM4 6v12h16V6H4zM16 8h4v4h-4zM16 14h4v4h-4zM10 8h4v4h-4zM10 14h4v4h-4zM4 8h4v4H4zM4 14h4v4H4z",
  },
];

function Dashboard() {
  const [themeMode, setThemeMode] = useState("dark");
  const currentTheme = themeMode === "dark" ? DARK_THEME : LIGHT_THEME;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);

  const navigate = useNavigate();

  const loadCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, "categories"));
      const cats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(cats);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadItems = async () => {
    try {
      const snapshot = await getDocs(collection(db, "items"));
      const itms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setItems(itms);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "customers"));
      const custs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCustomers(custs);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const loadVendors = async () => {
    try {
      const snapshot = await getDocs(collection(db, "vendors"));
      const vnds = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVendors(vnds);
    } catch (error) {
      console.error("Error loading vendors:", error);
    }
  };

  useEffect(() => {
    loadCategories();
    loadItems();
    loadCustomers();
    loadVendors();
  }, []);

  useEffect(() => {
    if (activePage === "item" || activePage === "category") {
      loadCategories();
      loadItems();
    }
    if (activePage === "customer") loadCustomers();
    if (activePage === "vendor") loadVendors();

    if (activePage === "purchase") {
      loadItems();
      loadVendors();
    }
    if (activePage === "saleReturn") {
      loadItems();
      loadCustomers();
    }
    if (activePage === "purchaseReturn") {
      loadItems();
      loadVendors();
    }

    const reportsSubItemIds = reportsSubItems.map((item) => item.id);
    if (reportsSubItemIds.includes(activePage)) {
      setIsReportsOpen(true);
    }
  }, [activePage]);

  useEffect(() => {
    if (activePage === "sale") {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [activePage]);

  const handlePageChange = (pageId) => {
    setActivePage(pageId);

    const masterDataSubItemIds = ["category", "item", "customer", "vendor"];
    const reportsSubItemIds = reportsSubItems.map((item) => item.id);

    if (masterDataSubItemIds.includes(pageId)) {
      setIsMasterDataOpen(true);
      setIsReportsOpen(false);
    } else if (pageId === "masterData") {
      setIsMasterDataOpen(!isMasterDataOpen);
      setIsReportsOpen(false);
      if (!isMasterDataOpen) {
        setActivePage("item");
      }
    } else if (reportsSubItemIds.includes(pageId)) {
      setIsReportsOpen(true);
      setIsMasterDataOpen(false);
    } else if (pageId === "reports") {
      setIsReportsOpen(!isReportsOpen);
      setIsMasterDataOpen(false);
      if (!isReportsOpen) {
        setActivePage(reportsSubItems[0].id);
      }
    } else {
      setIsMasterDataOpen(false);
      setIsReportsOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === "dark" ? "light" : "dark"));
  };

  const masterDataSubItems = [
    {
      id: "category",
      name: "Categories",
      icon: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
    },
    {
      id: "item",
      name: "Items",
      icon: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    },
    {
      id: "customer",
      name: "Customers",
      icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    },
    {
      id: "vendor",
      name: "Vendors",
      icon: "M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z",
    },
  ];

  const mainMenuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
      accent: currentTheme.PRIMARY,
    },
    {
      id: "sale",
      name: "POS Counter",
      icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM4 6v12h16V6H4zM16 8h4v4h-4zM16 14h4v4h-4zM10 8h4v4h-4zM10 14h4v4h-4zM4 8h4v4H4zM4 14h4v4H4z",
      accent: currentTheme.ACCENT_SUCCESS,
    },
    {
      id: "purchase",
      name: "Purchase Invoice",
      icon: "M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z",
      accent: currentTheme.ACCENT_INFO,
    },
    {
      id: "saleReturn",
      name: "Sale Return",
      icon: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
      accent: currentTheme.ACCENT_DANGER,
    },
    {
      id: "purchaseReturn",
      name: "Purchase Return",
      icon: "M20 19H4V8h16v11zM18 4h-4V3h-2v1H6V3H4v1H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h17c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z",
      accent: currentTheme.ACCENT_WARNING,
    },
    {
      id: "masterData",
      name: "Master Data",
      icon: "M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z",
      accent: currentTheme.ACCENT_WARNING,
      isParent: true,
    },
    {
      id: "reports",
      name: "Reports",
      icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
      accent: currentTheme.PRIMARY,
      isParent: true,
    },
    {
      id: "settings",
      name: "Settings",
      icon: "M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z",
      accent: currentTheme.PRIMARY,
    },
  ];

  const StatsCard = ({
    title,
    value,
    icon,
    gradient,
    trend,
    trendValue,
    onClick,
  }) => (
    <div
      style={{
        background: currentTheme.CARD_BG,
        borderRadius: "16px",
        padding: "24px",
        boxShadow: currentTheme.SHADOW_MD,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
        position: "relative",
        overflow: "hidden",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = currentTheme.SHADOW_LG;
        e.currentTarget.style.border = `1px solid ${currentTheme.PRIMARY}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = currentTheme.SHADOW_MD;
        e.currentTarget.style.border = `1px solid ${currentTheme.SIDEBAR_HOVER}`;
      }}
    >
      <div
        style={{
          position: "absolute",
          right: "-10px",
          top: "-10px",
          opacity: "0.05",
          transform: "rotate(-15deg)",
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ color: currentTheme.TEXT_PRIMARY }}
        >
          <path d={icon} />
        </svg>
      </div>

      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          boxShadow: `0 6px 12px ${
            gradient.includes("ef4444")
              ? "rgba(239, 68, 68, 0.3)"
              : "rgba(0,0,0,0.3)"
          }`,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d={icon} />
        </svg>
      </div>

      <div>
        <p
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: currentTheme.TEXT_MUTED,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            margin: "0 0 8px 0",
          }}
        >
          {title}
        </p>
        <h3
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: currentTheme.TEXT_PRIMARY,
            margin: "0",
            lineHeight: "1",
          }}
        >
          {value}
        </h3>
        {trend && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color:
                  trend === "up"
                    ? currentTheme.ACCENT_SUCCESS
                    : currentTheme.ACCENT_DANGER,
                background:
                  trend === "up"
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                padding: "4px 8px",
                borderRadius: "6px",
              }}
            >
              {trend === "up" ? "↑" : "↓"} {trendValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );

 // COMPLETE PROFESSIONAL DASHBOARD - Replace DashboardContent function
// COMPLETE DASHBOARD WITH PROPER FIREBASE DATA HANDLING
const DashboardContent = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Sales data fetch
        const salesSnap = await getDocs(collection(db, 'sales'));
        const sales = salesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('🔍 Total Sales Found:', sales.length);
        console.log('📊 Sample Sale:', sales[0]);

        // Calculate total revenue - trying multiple field names
        const total = sales.reduce((sum, sale) => {
          const saleTotal = sale.total || sale.totalAmount || sale.amount || sale.grandTotal || 0;
          return sum + Number(saleTotal);
        }, 0);
        
        setTotalRevenue(total);
        console.log('💰 Total Revenue:', total);

        // Last 7 days data
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          const nextDate = new Date(date);
          nextDate.setDate(date.getDate() + 1);
          
          const daySales = sales.filter(sale => {
            let saleDate;
            
            // Handle different date formats
            if (sale.date?.toDate) {
              // Firestore Timestamp
              saleDate = sale.date.toDate();
            } else if (sale.date?.seconds) {
              // Timestamp object
              saleDate = new Date(sale.date.seconds * 1000);
            } else if (sale.createdAt?.toDate) {
              // Alternative field name
              saleDate = sale.createdAt.toDate();
            } else if (typeof sale.date === 'string') {
              // String date
              saleDate = new Date(sale.date);
            } else if (sale.date instanceof Date) {
              // Already a Date object
              saleDate = sale.date;
            } else {
              // Use current date as fallback
              saleDate = new Date();
            }
            
            return saleDate >= date && saleDate < nextDate;
          });
          
          const dayRevenue = daySales.reduce((sum, sale) => {
            const saleTotal = sale.total || sale.totalAmount || sale.amount || sale.grandTotal || 0;
            return sum + Number(saleTotal);
          }, 0);
          
          last7Days.push({
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sales: dayRevenue,
            orders: daySales.length
          });
        }
        
        setSalesData(last7Days);
        console.log('📅 Last 7 Days Data:', last7Days);

        // Top products calculation
        const productSales = {};
        
        sales.forEach(sale => {
          const itemsList = sale.items || sale.products || sale.cartItems || [];
          
          if (Array.isArray(itemsList)) {
            itemsList.forEach(item => {
              const itemName = item.name || item.itemName || item.productName || 'Unknown';
              const itemQty = Number(item.quantity || item.qty || 0);
              const itemPrice = Number(item.price || item.unitPrice || item.salePrice || 0);
              
              if (!productSales[itemName]) {
                productSales[itemName] = { quantity: 0, revenue: 0 };
              }
              
              productSales[itemName].quantity += itemQty;
              productSales[itemName].revenue += itemQty * itemPrice;
            });
          }
        });

        const topProds = Object.entries(productSales)
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .slice(0, 5)
          .map(([name, data]) => ({ name, ...data }));
        
        setTopProducts(topProds);
        console.log('🏆 Top Products:', topProds);
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            border: `5px solid ${currentTheme.SIDEBAR_HOVER}`,
            borderTop: `5px solid ${currentTheme.PRIMARY}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ fontSize: '16px', fontWeight: '600', color: currentTheme.TEXT_PRIMARY }}>
            Loading Dashboard...
          </p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  const maxSale = Math.max(...salesData.map(d => d.sales), 100); // Minimum 100 for scale
  const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '800', 
          margin: '0 0 4px 0', 
          color: currentTheme.TEXT_PRIMARY,
          letterSpacing: '-0.5px'
        }}>
           Dashboard
        </h1>
        <p style={{ 
          fontSize: '14px', 
          color: currentTheme.TEXT_SECONDARY, 
          margin: 0 
        }}>
          Track your business performance and key metrics
        </p>
      </div>

      {/* CHART & TOP PRODUCTS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2.2fr 1fr', 
        gap: '20px', 
        marginBottom: '24px' 
      }}>
        
        {/* Sales Performance Chart */}
        <div style={{ 
          background: currentTheme.CARD_BG, 
          borderRadius: '20px', 
          padding: '28px', 
          boxShadow: currentTheme.SHADOW_MD,
          border: `1px solid ${currentTheme.SIDEBAR_HOVER}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: currentTheme.TEXT_PRIMARY, 
                margin: '0 0 4px 0' 
              }}>
                Sales Performance
              </h2>
              <p style={{ 
                fontSize: '13px', 
                color: currentTheme.TEXT_MUTED, 
                margin: 0 
              }}>
                Weekly revenue tracking
              </p>
            </div>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                background: currentTheme.SIDEBAR_BG,
                border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                color: currentTheme.TEXT_PRIMARY,
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>

          {/* Chart */}
          <div style={{ height: '420px', position: 'relative' }}>
            {salesData.length > 0 ? (
              <svg width="100%" height="100%" viewBox="0 0 800 420" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: currentTheme.PRIMARY, stopOpacity: 0.4 }} />
                    <stop offset="100%" style={{ stopColor: currentTheme.PRIMARY, stopOpacity: 0.02 }} />
                  </linearGradient>
                </defs>
                
                {/* Grid Lines */}
                {[0, 1, 2, 3, 4, 5].map(i => {
                  const value = maxSale - (i * maxSale / 5);
                  return (
                    <g key={i}>
                      <line 
                        x1="60" 
                        y1={i * 70} 
                        x2="800" 
                        y2={i * 70}
                        stroke={currentTheme.SIDEBAR_HOVER}
                        strokeWidth="1"
                        strokeDasharray="5 5"
                        opacity="0.4"
                      />
                      <text
                        x="5"
                        y={i * 70 + 5}
                        fill={currentTheme.TEXT_MUTED}
                        fontSize="12"
                        fontWeight="600"
                      >
                        {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(0)}
                      </text>
                    </g>
                  );
                })}

                {/* Area Fill */}
                <path
                  d={`M 60 ${350 - (salesData[0]?.sales || 0) / maxSale * 330} 
                      ${salesData.map((d, i) => 
                        `L ${60 + (i / (salesData.length - 1)) * 740} ${350 - (d.sales / maxSale * 330)}`
                      ).join(' ')} 
                      L 800 350 L 60 350 Z`}
                  fill="url(#salesGradient)"
                />

                {/* Line */}
                <path
                  d={`M 60 ${350 - (salesData[0]?.sales || 0) / maxSale * 330} 
                      ${salesData.map((d, i) => 
                        `L ${60 + (i / (salesData.length - 1)) * 740} ${350 - (d.sales / maxSale * 330)}`
                      ).join(' ')}`}
                  fill="none"
                  stroke={currentTheme.PRIMARY}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points & Labels */}
                {salesData.map((d, i) => {
                  const x = 60 + (i / (salesData.length - 1)) * 740;
                  const y = 350 - (d.sales / maxSale * 330);
                  return (
                    <g key={i}>
                      {/* Point */}
                      <circle
                        cx={x}
                        cy={y}
                        r="8"
                        fill={currentTheme.CARD_BG}
                        stroke={currentTheme.PRIMARY}
                        strokeWidth="4"
                      />
                      
                      {/* Day Label */}
                      <text
                        x={x}
                        y={390}
                        textAnchor="middle"
                        fill={currentTheme.TEXT_SECONDARY}
                        fontSize="14"
                        fontWeight="700"
                      >
                        {d.name}
                      </text>
                      
                      {/* Value Label */}
                      {d.sales > 0 && (
                        <text
                          x={x}
                          y={y - 15}
                          textAnchor="middle"
                          fill={currentTheme.PRIMARY}
                          fontSize="11"
                          fontWeight="700"
                        >
                          Rs {d.sales >= 1000 ? `${(d.sales / 1000).toFixed(1)}K` : d.sales.toFixed(0)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                gap: '12px'
              }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill={currentTheme.TEXT_MUTED} opacity="0.3">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
                <p style={{ 
                  color: currentTheme.TEXT_MUTED,
                  fontSize: '15px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  No sales data available
                </p>
                <p style={{ 
                  color: currentTheme.TEXT_MUTED,
                  fontSize: '13px',
                  margin: 0
                }}>
                  Start making sales to see the chart
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div style={{ 
          background: currentTheme.CARD_BG,
          borderRadius: '20px',
          padding: '28px',
          boxShadow: currentTheme.SHADOW_MD,
          border: `1px solid ${currentTheme.SIDEBAR_HOVER}`
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: currentTheme.TEXT_PRIMARY,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>🏆</span> Top Products
          </h3>
          
          <div style={{ maxHeight: '440px', overflowY: 'auto' }}>
            {topProducts.length > 0 ? topProducts.map((product, index) => {
              const maxRevenue = Math.max(...topProducts.map(p => p.revenue), 1);
              const percentage = (product.revenue / maxRevenue) * 100;
              const colors = [
                currentTheme.PRIMARY, 
                currentTheme.ACCENT_SUCCESS, 
                currentTheme.ACCENT_INFO, 
                currentTheme.ACCENT_WARNING, 
                '#8b5cf6'
              ];
              
              return (
                <div key={index} style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                      <div style={{
                        minWidth: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: `${colors[index]}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        color: colors[index],
                        fontSize: '13px'
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ 
                          margin: 0, 
                          fontWeight: '600', 
                          color: currentTheme.TEXT_PRIMARY,
                          fontSize: '13px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {product.name}
                        </p>
                        <p style={{ 
                          margin: '2px 0 0 0', 
                          fontSize: '11px', 
                          color: currentTheme.TEXT_MUTED 
                        }}>
                          {product.quantity} units
                        </p>
                      </div>
                    </div>
                    <span style={{ 
                      fontWeight: '700', 
                      color: colors[index],
                      fontSize: '13px',
                      marginLeft: '8px'
                    }}>
                      Rs {product.revenue >= 1000 ? `${(product.revenue / 1000).toFixed(1)}K` : product.revenue.toFixed(0)}
                    </span>
                  </div>
                  <div style={{ 
                    width: '100%',
                    height: '5px',
                    background: currentTheme.SIDEBAR_BG,
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: colors[index],
                      borderRadius: '3px',
                      transition: 'width 1s ease'
                    }}></div>
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ 
                  color: currentTheme.TEXT_MUTED,
                  fontSize: '13px',
                  margin: 0
                }}>
                  No product data available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        
        {/* Sales Volume */}
        <div style={{ 
          background: currentTheme.CARD_BG, 
          borderRadius: '14px', 
          padding: '20px', 
          boxShadow: currentTheme.SHADOW_SM,
          border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
          transition: 'all 0.2s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = currentTheme.SHADOW_MD;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = currentTheme.SHADOW_SM;
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: currentTheme.GRADIENT_PRIMARY,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div style={{ 
              background: `${currentTheme.ACCENT_SUCCESS}20`,
              color: currentTheme.ACCENT_SUCCESS,
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              ↑ 12.5%
            </div>
          </div>
          <p style={{ 
            fontSize: '11px', 
            color: currentTheme.TEXT_MUTED, 
            margin: '0 0 6px 0',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Sales Volume
          </p>
          <h2 style={{ 
            fontSize: '26px', 
            fontWeight: '800', 
            color: currentTheme.TEXT_PRIMARY, 
            margin: 0 
          }}>
            Rs {totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(1)}K` : totalRevenue.toFixed(0)}
          </h2>
        </div>

        {/* Total Orders */}
        <div style={{ 
          background: currentTheme.CARD_BG, 
          borderRadius: '14px', 
          padding: '20px', 
          boxShadow: currentTheme.SHADOW_SM,
          border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
          transition: 'all 0.2s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = currentTheme.SHADOW_MD;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = currentTheme.SHADOW_SM;
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: currentTheme.GRADIENT_SUCCESS,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </div>
            <div style={{ 
              background: `${currentTheme.ACCENT_SUCCESS}20`,
              color: currentTheme.ACCENT_SUCCESS,
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              ↑ 8.2%
            </div>
          </div>
          <p style={{ 
            fontSize: '11px', 
            color: currentTheme.TEXT_MUTED, 
            margin: '0 0 6px 0',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Total Orders
          </p>
          <h2 style={{ 
            fontSize: '26px', 
            fontWeight: '800', 
            color: currentTheme.TEXT_PRIMARY, 
            margin: 0 
          }}>
            {totalOrders}
          </h2>
        </div>

        {/* Avg Order Value */}
        <div style={{ 
          background: currentTheme.CARD_BG, 
          borderRadius: '14px', 
          padding: '20px', 
          boxShadow: currentTheme.SHADOW_SM,
          border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
          transition: 'all 0.2s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = currentTheme.SHADOW_MD;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = currentTheme.SHADOW_SM;
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: currentTheme.GRADIENT_INFO,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
            </div>
            <div style={{ 
              background: `${currentTheme.ACCENT_SUCCESS}20`,
              color: currentTheme.ACCENT_SUCCESS,
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              ↑ 3.8%
            </div>
          </div>
          <p style={{ 
            fontSize: '11px', 
            color: currentTheme.TEXT_MUTED, 
            margin: '0 0 6px 0',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Avg Order Value
          </p>
          <h2 style={{ 
            fontSize: '26px', 
            fontWeight: '800', 
            color: currentTheme.TEXT_PRIMARY, 
            margin: 0 
          }}>
            Rs {avgOrderValue.toFixed(0)}
          </h2>
        </div>

        {/* Active Customers */}
        <div style={{ 
          background: currentTheme.CARD_BG, 
          borderRadius: '14px', 
          padding: '20px', 
          boxShadow: currentTheme.SHADOW_SM,
          border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
          transition: 'all 0.2s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = currentTheme.SHADOW_MD;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = currentTheme.SHADOW_SM;
        }}
        onClick={() => handlePageChange("customer")}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: currentTheme.GRADIENT_WARNING,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <div style={{ 
              background: `${currentTheme.ACCENT_INFO}20`,
              color: currentTheme.ACCENT_INFO,
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {customers.length} Total
            </div>
          </div>
          <p style={{ 
            fontSize: '11px', 
            color: currentTheme.TEXT_MUTED, 
            margin: '0 0 6px 0',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Active Customers
          </p>
          <h2 style={{ 
            fontSize: '26px', 
            fontWeight: '800', 
            color: currentTheme.TEXT_PRIMARY, 
            margin: 0 
          }}>
            {customers.length}
          </h2>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ 
        background: currentTheme.CARD_BG,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: currentTheme.SHADOW_MD,
        border: `1px solid ${currentTheme.SIDEBAR_HOVER}`
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '700', 
          color: currentTheme.TEXT_PRIMARY,
          margin: '0 0 16px 0'
        }}>
          Quick Actions
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '14px' 
        }}>
          <button
            onClick={() => handlePageChange("sale")}
            style={{
              background: currentTheme.GRADIENT_SUCCESS,
              border: 'none',
              borderRadius: '12px',
              padding: '18px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>
              New Sale
            </span>
          </button>

          {masterDataSubItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              style={{
                background: currentTheme.SIDEBAR_BG,
                border: `2px solid ${currentTheme.SIDEBAR_HOVER}`,
                borderRadius: '12px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = currentTheme.PRIMARY;
                e.currentTarget.style.background = currentTheme.SIDEBAR_HOVER;
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = currentTheme.SIDEBAR_HOVER;
                e.currentTarget.style.background = currentTheme.SIDEBAR_BG;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: `${currentTheme.PRIMARY}15`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={currentTheme.PRIMARY}>
                  <path d={item.icon} />
                </svg>
              </div>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: currentTheme.TEXT_PRIMARY
              }}>
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardContent />;

      case "sale":
        return (
          <Sale
            db={db}
            items={items}
            categories={categories}
            loadItems={loadItems}
            loadCustomers={loadCustomers}
            currentTheme={currentTheme}
          />
        );

      case "purchase":
        return (
          <PurchaseManager
            db={db}
            vendors={vendors}
            items={items}
            loadVendors={loadVendors}
            loadItems={loadItems}
            currentTheme={currentTheme}
          />
        );

      case "saleReturn":
        return (
          <SaleReturnManager
            db={db}
            items={items}
            customers={customers}
            loadItems={loadItems}
            loadCustomers={loadCustomers}
            currentTheme={currentTheme}
          />
        );

      case "purchaseReturn":
        return (
          <PurchaseReturnManager
            db={db}
            items={items}
            vendors={vendors}
            loadItems={loadItems}
            loadVendors={loadVendors}
            currentTheme={currentTheme}
          />
        );

      case "category":
        return (
          <CategoryManager
            db={db}
            categories={categories}
            setCategories={setCategories}
            loadItems={loadItems}
            currentTheme={currentTheme}
          />
        );

      case "item":
        return (
          <ItemManager
            db={db}
            items={items}
            setItems={setItems}
            categories={categories}
            loadCategories={loadCategories}
            loadItems={loadItems}
            currentTheme={currentTheme}
          />
        );

      case "customer":
        return (
          <CustomerManager
            db={db}
            customers={customers}
            setCustomers={setCustomers}
            currentTheme={currentTheme}
          />
        );

      case "vendor":
        return (
          <VendorManager
            db={db}
            vendors={vendors}
            setVendors={setVendors}
            currentTheme={currentTheme}
          />
        );

      case "inventoryStock":
        return (
          <InventoryStock db={db} items={items} currentTheme={currentTheme} />
        );
        case "purchaseStock":
  return <PurchaseStock db={db} currentTheme={currentTheme} />;

      case "saleStock":
        return <SaleStock db={db} currentTheme={currentTheme} />;

      case "settings":
        return <Settings currentTheme={currentTheme} />;

      default:
        return <DashboardContent />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        background: currentTheme.BODY_BG,
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          width: sidebarOpen ? "280px" : "80px",
          background: currentTheme.SIDEBAR_BG,
          padding: sidebarOpen ? "24px" : "24px 0",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          boxShadow: currentTheme.SHADOW_MD,
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarOpen ? "space-between" : "center",
            marginBottom: "40px",
          }}
        >
          {sidebarOpen && (
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: currentTheme.PRIMARY,
                margin: 0,
              }}
            >
              <span style={{ color: currentTheme.TEXT_PRIMARY }}>Switcher</span>
              Techno
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              color: currentTheme.TEXT_MUTED,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = currentTheme.SIDEBAR_HOVER;
              e.currentTarget.style.color = currentTheme.PRIMARY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = currentTheme.TEXT_MUTED;
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                d={
                  sidebarOpen
                    ? "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                    : "M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"
                }
              />
            </svg>
          </button>
        </div>

        <nav>
          {mainMenuItems.map((item) => (
            <React.Fragment key={item.id}>
              <SidebarItem
                iconPath={item.icon}
                text={item.name}
                active={activePage}
                onClick={() => handlePageChange(item.id)}
                sidebarOpen={sidebarOpen}
                accentColor={item.accent}
                positionIndicator={item.id}
                isParent={item.isParent}
                currentTheme={currentTheme}
                hasDropdown={item.isParent}
                isOpen={
                  item.id === "masterData"
                    ? isMasterDataOpen
                    : item.id === "reports"
                    ? isReportsOpen
                    : false
                }
              />
              {item.id === "masterData" && isMasterDataOpen && sidebarOpen && (
                <div style={{ paddingLeft: "0px", margin: "10px 0" }}>
                  {masterDataSubItems.map((subItem) => (
                    <SidebarSubItem
                      key={subItem.id}
                      iconPath={subItem.icon}
                      text={subItem.name}
                      active={activePage}
                      pageId={subItem.id}
                      onClick={() => handlePageChange(subItem.id)}
                      currentTheme={currentTheme}
                    />
                  ))}
                </div>
              )}
              {item.id === "reports" && isReportsOpen && sidebarOpen && (
                <div style={{ paddingLeft: "0px", margin: "10px 0" }}>
                  {reportsSubItems.map((subItem) => (
                    <SidebarSubItem
                      key={subItem.id}
                      iconPath={subItem.icon}
                      text={subItem.name}
                      active={activePage}
                      pageId={subItem.id}
                      onClick={() => handlePageChange(subItem.id)}
                      currentTheme={currentTheme}
                    />
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarOpen ? "space-between" : "center",
              padding: sidebarOpen ? "14px 16px" : "14px 0",
              margin: "6px 0",
              borderRadius: "10px",
              background: currentTheme.SIDEBAR_HOVER,
              fontWeight: "600",
              color: currentTheme.TEXT_PRIMARY,
            }}
          >
            {sidebarOpen && (
              <span style={{ fontSize: "15px" }}>
                {themeMode === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
            )}
            <button
              onClick={toggleTheme}
              style={{
                background: currentTheme.PRIMARY_DARK,
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
              title="Toggle Theme"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = currentTheme.PRIMARY)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = currentTheme.PRIMARY_DARK)
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path
                  d={
                    themeMode === "dark"
                      ? "M12 3a9 9 0 109 9c0-.46-.04-.91-.12-1.35C20.37 7.03 16.66 3 12 3z"
                      : "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58l-1.41 1.41c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0l1.41-1.41c.39-.39.39-1.02 0-1.41s-1.02-.39-1.41 0zM18.42 18.42l-1.41-1.41c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41l1.41 1.41c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41zM18.42 5.99c.39.39.39 1.02 0 1.41l-1.41 1.41c-.39.39-1.02.39-1.41 0s-.39-1.02 0-1.41l1.41-1.41c.39-.39 1.02-.39 1.41 0zM5.99 18.42c.39-.39.39-1.02 0-1.41l-1.41-1.41c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41l1.41 1.41c.39.39 1.02.39 1.41 0z"
                  }
                />
              </svg>
            </button>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "14px 16px",
              marginTop: "10px",
              borderRadius: "10px",
              background: currentTheme.ACCENT_DANGER,
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "600",
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              gap: "10px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = currentTheme.PRIMARY_DARK)
            }
             onMouseLeave={(e) =>
              (e.currentTarget.style.background = currentTheme.ACCENT_DANGER)
            }
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="white"
              style={{ flexShrink: 0 }}
            >
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </div>

      <main
        style={{
          flexGrow: 1,
          padding: "32px",
          maxWidth: "calc(100vw - 80px)",
          overflowX: "hidden",
        }}
      >
        {renderContent()}
      </main>
    </div>
  );
}

export default Dashboard;