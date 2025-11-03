import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  serverTimestamp,
  doc,
  runTransaction,
  getDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

const THEME = {
  BG: "#0f0f0f",
  CARD_BG: "#1a1a1a",
  INPUT_BG: "#252525",
  BORDER: "#333333",
  TEXT: "#ffffff",
  TEXT_MUTED: "#999999",
  PRIMARY: "#3b82f6",
  SECONDARY: "#6366f1",
  SUCCESS: "#10b981",
  DANGER: "#ef4444",
  WARNING: "#f59e0b",
  ACCENT: "#8b5cf6",
};

// ========== FIND SALES MODAL ==========
const FindSalesModal = ({ isOpen, onClose, db, onLoadInvoice }) => {
  const [salesData, setSalesData] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    invoiceNo: "",
    customerName: "",
    phone: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadAllSales();
    }
  }, [isOpen]);

  useEffect(() => {
    applyFilters();
  }, [searchFilters, salesData]);

  const loadAllSales = async () => {
    setLoading(true);
    try {
      const salesCol = collection(db, "sales");
      const q = query(salesCol, orderBy("createdAt", "desc"), limit(100));
      const salesSnapshot = await getDocs(q);
      
      const salesList = salesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          invoiceNo: data.invoiceNo || doc.id,
          customerName: data.customerName || "Walk-in",
          phone: data.customerId || "N/A",
          total: data.total || 0,
          createdAt: data.createdAt,
          items: data.items || [],
          paymentMethod: data.paymentMethod || "Cash",
          date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : "N/A",
          time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleTimeString() : "N/A",
        };
      });
      
      setSalesData(salesList);
      setFilteredSales(salesList);
    } catch (error) {
      console.error("Error loading sales:", error);
      alert("Failed to load sales data!");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...salesData];

    if (searchFilters.invoiceNo.trim()) {
      filtered = filtered.filter((sale) =>
        sale.invoiceNo.toString().includes(searchFilters.invoiceNo.trim())
      );
    }

    if (searchFilters.customerName.trim()) {
      filtered = filtered.filter((sale) =>
        sale.customerName.toLowerCase().includes(searchFilters.customerName.toLowerCase())
      );
    }

    if (searchFilters.phone.trim()) {
      filtered = filtered.filter((sale) =>
        sale.phone.includes(searchFilters.phone.trim())
      );
    }

    setFilteredSales(filtered);
  };

  const handleFilterChange = (field, value) => {
    setSearchFilters({ ...searchFilters, [field]: value });
  };

  const clearFilters = () => {
    setSearchFilters({ invoiceNo: "", customerName: "", phone: "" });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: THEME.CARD_BG,
          borderRadius: "12px",
          width: "100%",
          maxWidth: "1000px",
          height: "85vh",
          color: THEME.TEXT,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: THEME.PRIMARY,
            padding: "15px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
            🔍 Find Sales
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "28px",
              cursor: "pointer",
              padding: "0 8px",
              lineHeight: "1",
            }}
          >
            ×
          </button>
        </div>

        {/* FILTERS */}
        <div
          style={{
            padding: "15px 20px",
            background: THEME.INPUT_BG,
            borderBottom: `1px solid ${THEME.BORDER}`,
          }}
        >
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Search by Invoice No..."
              value={searchFilters.invoiceNo}
              onChange={(e) => handleFilterChange("invoiceNo", e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                background: THEME.CARD_BG,
                border: `1px solid ${THEME.BORDER}`,
                borderRadius: "6px",
                color: THEME.TEXT,
                fontSize: "14px",
              }}
            />
            <input
              type="text"
              placeholder="Search by Customer Name..."
              value={searchFilters.customerName}
              onChange={(e) => handleFilterChange("customerName", e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                background: THEME.CARD_BG,
                border: `1px solid ${THEME.BORDER}`,
                borderRadius: "6px",
                color: THEME.TEXT,
                fontSize: "14px",
              }}
            />
            <input
              type="text"
              placeholder="Search by Phone..."
              value={searchFilters.phone}
              onChange={(e) => handleFilterChange("phone", e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                background: THEME.CARD_BG,
                border: `1px solid ${THEME.BORDER}`,
                borderRadius: "6px",
                color: THEME.TEXT,
                fontSize: "14px",
              }}
            />
            <button
              onClick={clearFilters}
              style={{
                padding: "10px 20px",
                background: THEME.DANGER,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Clear
            </button>
          </div>
          <div style={{ fontSize: "12px", color: THEME.TEXT_MUTED }}>
            Showing {filteredSales.length} of {salesData.length} sales
          </div>
        </div>

        {/* SALES LIST */}
        <div style={{ flex: 1, overflowY: "auto", padding: "15px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: THEME.TEXT_MUTED }}>
              <div style={{ fontSize: "24px", marginBottom: "10px" }}>⏳</div>
              Loading sales data...
            </div>
          ) : filteredSales.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: THEME.TEXT_MUTED }}>
              <div style={{ fontSize: "24px", marginBottom: "10px" }}>📭</div>
              No sales found matching your filters
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  style={{
                    background: THEME.INPUT_BG,
                    padding: "15px",
                    borderRadius: "8px",
                    border: `1px solid ${THEME.BORDER}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = THEME.CARD_BG;
                    e.currentTarget.style.borderColor = THEME.PRIMARY;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = THEME.INPUT_BG;
                    e.currentTarget.style.borderColor = THEME.BORDER;
                  }}
                  onClick={() => {
                    onLoadInvoice(sale.invoiceNo);
                    onClose();
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                      <span
                        style={{
                          background: THEME.PRIMARY,
                          color: "white",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          fontSize: "14px",
                        }}
                      >
                        #{sale.invoiceNo}
                      </span>
                      <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                        {sale.customerName}
                      </span>
                      <span
                        style={{
                          background: sale.paymentMethod === "Cash" ? THEME.SUCCESS : THEME.WARNING,
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                        }}
                      >
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: THEME.TEXT_MUTED }}>
                      Phone: {sale.phone} | Items: {sale.items.length} | Date: {sale.date} {sale.time}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: THEME.PRIMARY }}>
                      Rs. {sale.total.toFixed(2)}
                    </div>
                    <div style={{ fontSize: "12px", color: THEME.TEXT_MUTED, marginTop: "5px" }}>
                      Click to view
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "15px 20px",
            background: THEME.INPUT_BG,
            borderTop: `1px solid ${THEME.BORDER}`,
            display: "flex",
            justifyContent: "flex-end",
            borderBottomLeftRadius: "12px",
            borderBottomRightRadius: "12px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 30px",
              background: THEME.DANGER,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== COMPACT CREDIT CARD PAYMENT MODAL ==========
const CreditCardPaymentModal = ({ isOpen, grandTotal, customer, onConfirm, onClose }) => {
  const [oldBalance, setOldBalance] = useState(0);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [carriageFreight, setCarriageFreight] = useState(0);
  const [received, setReceived] = useState(0);
  const [netTotal, setNetTotal] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (isOpen && customer) {
      const custOldBalance = parseFloat(customer?.balance || 0);
      setOldBalance(custOldBalance);
      setAdditionalDiscount(0);
      setCarriageFreight(0);
      setReceived(0);
    }
  }, [isOpen, customer]);

  useEffect(() => {
    const calculatedNetTotal = grandTotal + oldBalance + carriageFreight - additionalDiscount;
    setNetTotal(calculatedNetTotal);
    const calculatedBalance = calculatedNetTotal - received;
    setBalance(calculatedBalance);
  }, [grandTotal, oldBalance, additionalDiscount, carriageFreight, received]);

  const handleConfirm = () => {
    const paymentData = {
      oldBalance,
      additionalDiscount,
      carriageFreight,
      received,
      netTotal,
      balance,
    };
    onConfirm(paymentData);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "15px",
      }}
    >
      <div
        style={{
          background: THEME.CARD_BG,
          borderRadius: "12px",
          width: "100%",
          maxWidth: "400px",
          color: THEME.TEXT,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: THEME.PRIMARY,
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
            Credit Card Payment
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "20px",
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "16px" }}>
          {customer && (
            <div
              style={{
                background: THEME.INPUT_BG,
                padding: "8px 12px",
                borderRadius: "6px",
                marginBottom: "12px",
                fontSize: "13px",
              }}
            >
              <div style={{ fontWeight: "bold" }}>
                {customer.customerName || "Walk-in"}
              </div>
              <div style={{ color: THEME.TEXT_MUTED, fontSize: "12px" }}>
                {customer.phone || ""}
              </div>
            </div>
          )}

          <div
            style={{
              background: THEME.INPUT_BG,
              padding: "10px 12px",
              borderRadius: "6px",
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px",
            }}
          >
            <span style={{ color: THEME.TEXT_MUTED }}>Grand Total:</span>
            <span style={{ fontWeight: "bold", color: THEME.WARNING }}>
              Rs. {grandTotal.toFixed(2)}
            </span>
          </div>

          {[
            { label: "Old Balance", value: oldBalance, set: setOldBalance },
            { label: "Add. Discount", value: additionalDiscount, set: setAdditionalDiscount },
            { label: "C&F", value: carriageFreight, set: setCarriageFreight },
          ].map((field, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "12px", color: THEME.TEXT_MUTED, display: "block", marginBottom: "4px" }}>
                {field.label}:
              </label>
              <input
                type="number"
                value={field.value}
                onChange={(e) => field.set(parseFloat(e.target.value) || 0)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: THEME.INPUT_BG,
                  border: `1px solid ${THEME.BORDER}`,
                  borderRadius: "6px",
                  color: THEME.TEXT,
                  fontSize: "14px",
                }}
              />
            </div>
          ))}

          <div
            style={{
              background: THEME.PRIMARY,
              color: "white",
              padding: "10px 12px",
              borderRadius: "6px",
              margin: "12px 0",
              textAlign: "center",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Net Total: Rs. {netTotal.toFixed(2)}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "12px", color: THEME.TEXT_MUTED, display: "block", marginBottom: "4px" }}>
              Received:
            </label>
            <input
              type="number"
              value={received}
              onChange={(e) => setReceived(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              style={{
                width: "100%",
                padding: "10px",
                background: THEME.INPUT_BG,
                border: `2px solid ${THEME.SUCCESS}`,
                borderRadius: "6px",
                color: THEME.TEXT,
                fontWeight: "bold",
                fontSize: "16px",
              }}
            />
          </div>

          <div
            style={{
              background: balance > 0 ? THEME.DANGER : balance < 0 ? THEME.SUCCESS : THEME.INPUT_BG,
              color: "white",
              padding: "12px",
              borderRadius: "6px",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {balance > 0 ? "Customer Owes:" : balance < 0 ? "Advance:" : "Balanced"}
            <div style={{ fontSize: "20px", marginTop: "4px" }}>
              Rs. {Math.abs(balance).toFixed(2)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "12px 16px",
            background: THEME.INPUT_BG,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              background: THEME.DANGER,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 2,
              padding: "10px",
              background: THEME.SUCCESS,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== CASH PAYMENT MODAL ==========
const CashPaymentModal = ({ isOpen, totalAmount, onConfirm, onClose }) => {
  const [amountReceived, setAmountReceived] = useState("");
  const [change, setChange] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setAmountReceived("");
      setChange(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const received = parseFloat(amountReceived) || 0;
    const calculatedChange = received - totalAmount;
    setChange(calculatedChange >= 0 ? calculatedChange : 0);
  }, [amountReceived, totalAmount]);

  const handleQuickAmount = (amount) => {
    setAmountReceived(amount.toString());
  };

  const handleConfirm = () => {
    const received = parseFloat(amountReceived) || 0;
    if (received < totalAmount) {
      alert("Amount received is less than total amount!");
      return;
    }
    onConfirm();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: THEME.CARD_BG,
          padding: "30px",
          borderRadius: "8px",
          width: "450px",
          color: THEME.TEXT,
          border: `2px solid ${THEME.PRIMARY}`,
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            fontSize: "24px",
            color: THEME.PRIMARY,
            textAlign: "center",
          }}
        >
          Cash Payment
        </h2>

        <div
          style={{
            background: THEME.INPUT_BG,
            padding: "15px",
            borderRadius: "6px",
            marginBottom: "20px",
            border: `1px solid ${THEME.BORDER}`,
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: THEME.TEXT_MUTED,
              marginBottom: "5px",
            }}
          >
            Total Amount:
          </div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: THEME.WARNING }}>
            Rs. {totalAmount.toFixed(2)}
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              color: THEME.TEXT_MUTED,
              marginBottom: "8px",
            }}
          >
            Amount Received:
          </label>
          <input
            type="number"
            value={amountReceived}
            onChange={(e) => setAmountReceived(e.target.value)}
            placeholder="Enter amount..."
            autoFocus
            style={{
              width: "100%",
              padding: "15px",
              fontSize: "24px",
              textAlign: "right",
              background: THEME.INPUT_BG,
              border: `2px solid ${THEME.PRIMARY}`,
              borderRadius: "6px",
              color: THEME.TEXT,
              fontWeight: "bold",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          {[500, 1000, 2000, 5000].map((amt) => (
            <button
              key={amt}
              onClick={() => handleQuickAmount(amt)}
              style={{
                padding: "10px",
                background: THEME.INPUT_BG,
                color: THEME.TEXT,
                border: `1px solid ${THEME.BORDER}`,
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = THEME.PRIMARY;
                e.target.style.color = "white";
              }}
              onMouseOut={(e) => {
                e.target.style.background = THEME.INPUT_BG;
                e.target.style.color = THEME.TEXT;
              }}
            >
              {amt}
            </button>
          ))}
        </div>

        <div
          style={{
            background: change > 0 ? THEME.SUCCESS : THEME.INPUT_BG,
            padding: "15px",
            borderRadius: "6px",
            marginBottom: "20px",
            border: `1px solid ${change > 0 ? THEME.SUCCESS : THEME.BORDER}`,
            transition: "all 0.3s",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: change > 0 ? "white" : THEME.TEXT_MUTED,
              marginBottom: "5px",
            }}
          >
            Change to Return:
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: change > 0 ? "white" : THEME.TEXT,
            }}
          >
            Rs. {change.toFixed(2)}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "15px",
              background: THEME.DANGER,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 2,
              padding: "15px",
              background: THEME.SUCCESS,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== KEYPAD MODAL ==========
const KeypadModal = ({
  isOpen,
  type,
  product,
  currentValue,
  onUpdate,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const title = type === "price" ? "Change price" : "Change quantity";
  const subtitle =
    type === "price"
      ? `Product: "${product?.itemName}"\nPrice: ${
          product?.price?.toFixed(2) || "0.00"
        }`
      : `Product: "${product?.itemName}"\nDefault quantity: 1.000`;

  const handleKey = (key) => {
    if (key === "esc") {
      onClose();
    } else if (key === "del") {
      onUpdate(currentValue.slice(0, -1) || "0");
    } else if (key === "Enter") {
      onConfirm();
    } else if (key === ".") {
      if (type === "price" && !currentValue.includes(".")) {
        onUpdate(currentValue + ".");
      }
    } else {
      if (currentValue === "0" && key !== "00") {
        onUpdate(key);
      } else if (currentValue !== "0" || key === "0") {
        onUpdate(currentValue + key);
      }
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: THEME.CARD_BG,
          padding: "30px",
          borderRadius: "8px",
          width: "350px",
          color: THEME.TEXT,
        }}
      >
        <h3 style={{ margin: "0 0 5px 0", fontSize: "20px" }}>{title}</h3>
        <p
          style={{
            margin: "0 0 20px 0",
            fontSize: "13px",
            color: THEME.TEXT_MUTED,
            whiteSpace: "pre-wrap",
          }}
        >
          {subtitle}
        </p>

        <input
          type="text"
          value={currentValue}
          readOnly
          style={{
            width: "100%",
            padding: "15px",
            marginBottom: "20px",
            fontSize: "24px",
            textAlign: "right",
            background: THEME.INPUT_BG,
            border: `2px solid ${THEME.PRIMARY}`,
            borderRadius: "4px",
            color: THEME.PRIMARY,
            fontWeight: "bold",
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
          }}
        >
          {["1", "2", "3", "del"].map((k) => (
            <button
              key={k}
              onClick={() => handleKey(k)}
              style={{
                padding: "15px",
                background: k === "del" ? THEME.DANGER : THEME.INPUT_BG,
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {k === "del" ? "Delete" : k}
            </button>
          ))}
          {["4", "5", "6", "esc"].map((k) => (
            <button
              key={k}
              onClick={() => handleKey(k)}
              style={{
                padding: "15px",
                background: k === "esc" ? THEME.DANGER : THEME.INPUT_BG,
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {k === "esc" ? "ESC" : k}
            </button>
          ))}
          {["7", "8", "9", "Enter"].map((k) => (
            <button
              key={k}
              onClick={() => handleKey(k)}
              style={{
                padding: "15px",
                background: k === "Enter" ? THEME.SUCCESS : THEME.INPUT_BG,
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {k === "Enter" ? "Enter" : k}
            </button>
          ))}
          <button
            onClick={() => handleKey("-")}
            style={{
              padding: "15px",
              background: THEME.INPUT_BG,
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "not-allowed",
              opacity: 0.5,
            }}
            disabled
          >
            -
          </button>
          <button
            onClick={() => handleKey("0")}
            style={{
              padding: "15px",
              background: THEME.INPUT_BG,
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            0
          </button>
          <button
            onClick={() => handleKey(".")}
            style={{
              padding: "15px",
              background: THEME.INPUT_BG,
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            .
          </button>
          <button
            onClick={() => handleKey("00")}
            style={{
              padding: "15px",
              background: THEME.INPUT_BG,
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            00
          </button>
        </div>

        <button
          onClick={onConfirm}
          style={{
            width: "100%",
            padding: "15px",
            marginTop: "15px",
            background: THEME.SUCCESS,
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

const qtyBtnStyle = {
  background: THEME.INPUT_BG,
  color: "white",
  border: "none",
  padding: "4px 10px",
  borderRadius: "3px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  background: THEME.INPUT_BG,
  border: `1px solid ${THEME.BORDER}`,
  borderRadius: "4px",
  color: THEME.TEXT,
  fontSize: "14px",
  boxSizing: "border-box",
};

const summaryRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  fontSize: "14px",
};

const topIconBtnStyle = {
  padding: "10px 18px",
  background: THEME.INPUT_BG,
  color: "white",
  border: `1px solid ${THEME.BORDER}`,
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "all 0.2s ease",
  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
};

// ========== MAIN SALE COMPONENT ==========
const Sale = ({ db }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(5.0);
  const [loading, setLoading] = useState(false);
  
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [allInvoices, setAllInvoices] = useState([]);
  
  const [pendingSales, setPendingSales] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [modal, setModal] = useState({
    isOpen: false,
    type: null,
    product: null,
    currentValue: "0",
  });

  const [showCashModal, setShowCashModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showFindModal, setShowFindModal] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const salesCol = collection(db, "sales");
      const q = query(salesCol, orderBy("createdAt", "desc"));
      const salesSnapshot = await getDocs(q);
      
      const invoicesList = salesSnapshot.docs.map((doc) => ({
        id: doc.id,
        invoiceNo: doc.data().invoiceNo || doc.id,
        ...doc.data(),
      }));
      
      setAllInvoices(invoicesList);
      
      if (invoicesList.length > 0) {
        const lastInvoice = invoicesList[0];
        const lastInvoiceNo = parseInt(lastInvoice.invoiceNo) || invoicesList.length;
        setCurrentInvoiceNo(lastInvoiceNo + 1);
      } else {
        setCurrentInvoiceNo(1);
      }
    } catch (error) {
      console.error("Error loading invoices:", error);
      setCurrentInvoiceNo(1);
    }
  };

  const loadInvoiceByNumber = async (invoiceNo) => {
    try {
      const invoice = allInvoices.find(inv => 
        parseInt(inv.invoiceNo) === parseInt(invoiceNo) || inv.id === invoiceNo
      );
      
      if (invoice) {
        setCart(invoice.items.map(item => ({
          ...item,
          itemName: item.name,
        })));
        setCustomerName(invoice.customerName || "");
        setDiscount(invoice.discount || 0);
        setTaxRate(invoice.taxRate || 5);
        setCurrentInvoiceNo(parseInt(invoice.invoiceNo) || parseInt(invoiceNo));
        setIsEditMode(true);
        
        if (invoice.customerId) {
          const customer = customers.find(c => c.customerId === invoice.customerId);
          if (customer) {
            setSelectedCustomer(customer);
          }
        }
        
        alert(`Invoice #${invoice.invoiceNo || invoiceNo} loaded!\nEdit mode enabled`);
      } else {
        alert(`Invoice #${invoiceNo} not found!`);
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
      alert("Failed to load invoice!");
    }
  };

  const handlePreviousInvoice = () => {
    if (!currentInvoiceNo || currentInvoiceNo <= 1) {
      alert("No previous invoice!");
      return;
    }
    
    const prevInvoiceNo = currentInvoiceNo - 1;
    loadInvoiceByNumber(prevInvoiceNo);
  };

  const handleNextInvoice = () => {
    if (!currentInvoiceNo) return;
    
    const maxInvoice = allInvoices.length > 0 ? 
      Math.max(...allInvoices.map(inv => parseInt(inv.invoiceNo) || 0)) : 0;
    
    if (currentInvoiceNo >= maxInvoice) {
      alert("This is the latest invoice!");
      return;
    }
    
    const nextInvoiceNo = currentInvoiceNo + 1;
    loadInvoiceByNumber(nextInvoiceNo);
  };

  useEffect(() => {
    let barcodeBuffer = "";
    let barcodeTimeout = null;

    const handleGlobalKeyPress = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      if (barcodeTimeout) {
        clearTimeout(barcodeTimeout);
      }

      if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }

      barcodeTimeout = setTimeout(() => {
        if (barcodeBuffer.length > 2) {
          const scannedBarcode = barcodeBuffer.trim();
          const product = products.find((p) => p.barcode === scannedBarcode);

          if (product) {
            directAddToCart(product, 1);
            console.log(`Added: ${product.itemName}`);
          } else {
            const productByName = products.find((p) =>
              p.itemName?.toLowerCase().includes(scannedBarcode.toLowerCase())
            );

            if (productByName) {
              directAddToCart(productByName, 1);
            } else {
              alert(`Product not found: ${scannedBarcode}`);
            }
          }
        }
        barcodeBuffer = "";
      }, 100);
    };

    document.addEventListener("keypress", handleGlobalKeyPress);

    return () => {
      document.removeEventListener("keypress", handleGlobalKeyPress);
      if (barcodeTimeout) {
        clearTimeout(barcodeTimeout);
      }
    };
  }, [products]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.getElementById("search-container");
      if (searchContainer && !searchContainer.contains(event.target)) {
        setIsDropdownOpen(false);
        setFilteredProducts([]);
      }

      const customerContainer = document.getElementById("customer-container");
      if (customerContainer && !customerContainer.contains(event.target)) {
        setIsCustomerDropdownOpen(false);
        setFilteredCustomers([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadProducts = async () => {
    try {
      const productsCol = collection(db, "items");
      const productSnapshot = await getDocs(productsCol);
      const productList = productSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          price: parseFloat(data.sellPrice) || 0,
          itemName: data.itemName || "Unnamed Item",
          itemCode: data.itemCode || data.barcode || doc.id,
          barcode: data.barcode || null,
          stock: parseFloat(data.stock || data.quantity || 0),
        };
      });
      setProducts(productList);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      const customersCol = collection(db, "customers");
      const customerSnapshot = await getDocs(customersCol);
      const customerList = customerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCustomers(customerList);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const calculateSubtotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const calculateTax = () => calculateSubtotal() * (taxRate / 100);
  const calculateTotal = () => calculateSubtotal() + calculateTax() - discount;

  const resetSaleState = () => {
    setCart([]);
    setDiscount(0);
    setCustomerName("");
    setSelectedCustomer(null);
    setPaymentMethod("Cash");
    setIsEditMode(false);
    loadInvoices();
  };

  const handleHoldSale = () => {
    if (cart.length === 0) {
      alert("Cart is empty. Nothing to hold.");
      return;
    }

    const saleToHold = {
      id: Date.now(),
      items: cart,
      customerName: customerName || "Walk-in",
      selectedCustomer: selectedCustomer,
      total: calculateTotal(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setPendingSales([...pendingSales, saleToHold]);
    resetSaleState();
    alert(`Sale for ${saleToHold.customerName} held (ID: ${saleToHold.id}).`);
  };

  const handleResumeSale = (saleId) => {
    const saleToResume = pendingSales.find((sale) => sale.id === saleId);

    if (saleToResume) {
      if (cart.length > 0) {
        if (
          !window.confirm(
            "Current sale will be put on hold. Do you want to continue?"
          )
        ) {
          return;
        }
        handleHoldSale();
      }

      setCart(saleToResume.items);
      setCustomerName(saleToResume.customerName);
      setSelectedCustomer(saleToResume.selectedCustomer || null);
      setPendingSales(pendingSales.filter((sale) => sale.id !== saleId));
    }
  };

  const handleDeletePendingSale = (saleId) => {
    if (window.confirm("Are you sure you want to delete this pending sale?")) {
      setPendingSales(pendingSales.filter((sale) => sale.id !== saleId));
    }
  };

  const directAddToCart = (product, quantity = 1) => {
    const itemToAdd = { ...product, quantity: quantity };
    const existingIndex = cart.findIndex((item) => item.id === itemToAdd.id);

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex] = {
        ...newCart[existingIndex],
        quantity: newCart[existingIndex].quantity + quantity,
      };
      setCart(newCart);
    } else {
      setCart([...cart, itemToAdd]);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim().length > 0) {
      const lowerCaseValue = value.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.itemName?.toLowerCase().includes(lowerCaseValue) ||
          p.barcode?.includes(value.trim())
      );

      setFilteredProducts(filtered);
      setIsDropdownOpen(filtered.length > 0);
    } else {
      setFilteredProducts([]);
      setIsDropdownOpen(false);
    }
  };

  const handleBarcodeSearch = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      const searchInput = searchTerm.trim();

      const itemToAddToCart =
        products.find((p) => p.barcode === searchInput) || filteredProducts[0];

      if (itemToAddToCart) {
        directAddToCart(itemToAddToCart, 1);
        setSearchTerm("");
        setFilteredProducts([]);
        setIsDropdownOpen(false);
      } else {
        alert(`Product "${searchTerm}" not found!`);
      }
    }
  };

  const handleDropdownItemClick = (product) => {
    directAddToCart(product, 1);
    setSearchTerm("");
    setFilteredProducts([]);
    setIsDropdownOpen(false);
  };

  const handleCustomerSelect = async (customer) => {
    try {
      const customerRef = doc(db, "customers", customer.id);
      const customerDoc = await getDoc(customerRef);
      
      let latestCustomerData;
      if (customerDoc.exists()) {
        latestCustomerData = {
          id: customerDoc.id,
          ...customerDoc.data()
        };
      } else {
        latestCustomerData = customer;
      }
      
      setCustomerName(latestCustomerData.customerName);
      setSelectedCustomer(latestCustomerData);
      
      setFilteredCustomers([]);
      setIsCustomerDropdownOpen(false);

      if (latestCustomerData.customerType === 'Credit' && cart.length > 0) {
        setTimeout(() => {
          setShowCardModal(true);
        }, 100);
      }
      
    } catch (error) {
      console.error("Error fetching customer data:", error);
      setCustomerName(customer.customerName);
      setSelectedCustomer(customer);
      setFilteredCustomers([]);
      setIsCustomerDropdownOpen(false);
    }
  };

  const handleTaxRateChange = (e) => {
    const value = e.target.value;
    const newRate = parseFloat(value);
    setTaxRate(isNaN(newRate) || newRate < 0 ? 0 : newRate);
  };

  const handleCashPayment = () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    setShowCashModal(true);
  };

  const handleCreditCardPayment = () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    
    if (!selectedCustomer) {
      alert("Please select a customer for credit card payment!");
      return;
    }
    
    setShowCardModal(true);
  };

  const handlePayment = async (cardPaymentData = null) => {
    setLoading(true);
    setShowCashModal(false);
    setShowCardModal(false);
    let newSaleDocId = null;

    try {
      await runTransaction(db, async (transaction) => {
        const itemReads = [];
        for (const item of cart) {
          const itemRef = doc(db, "items", item.id);
          const itemDoc = await transaction.get(itemRef);

          if (!itemDoc.exists()) {
            throw new Error(
              `Product "${item.itemName}" not found in database!`
            );
          }

          const itemData = itemDoc.data();
          const currentStock = parseFloat(
            itemData.stock || itemData.quantity || 0
          );
          const soldQuantity = parseFloat(item.quantity);
          const newStock = currentStock - soldQuantity;

          if (newStock < 0) {
            throw new Error(
              `Insufficient stock for "${item.itemName}"!\nAvailable: ${currentStock}, Required: ${soldQuantity}`
            );
          }

          itemReads.push({
            ref: itemRef,
            newStock: newStock,
          });
        }

        const salesCol = collection(db, "sales");
        const newSaleDocRef = doc(salesCol);
        newSaleDocId = newSaleDocRef.id;

        const saleData = {
          recid: newSaleDocId,
          invoiceNo: currentInvoiceNo,
          items: cart.map((item) => ({
            id: item.id,
            itemCode: item.itemCode || item.barcode || item.id,
            name: item.itemName,
            quantity: item.quantity,
            price: item.price,
            amount: item.price * item.quantity,
          })),
          customerName: customerName.trim() || "Walk-in",
          customerId: selectedCustomer?.customerId || null,
          customerType: selectedCustomer?.customerType || "Cash",
          paymentMethod: cardPaymentData ? "Card" : "Cash",
          subtotal: calculateSubtotal(),
          taxRate: taxRate,
          tax: calculateTax(),
          discount: discount,
          total: calculateTotal(),
          createdAt: serverTimestamp(),
          saleDate: serverTimestamp(),
          status: "completed",
        };

        if (cardPaymentData) {
          saleData.cardPaymentDetails = cardPaymentData;
          saleData.netTotal = cardPaymentData.netTotal;
          saleData.balance = cardPaymentData.balance;
          saleData.receivedAmount = cardPaymentData.received;
          
          if (selectedCustomer && selectedCustomer.id) {
            const customerRef = doc(db, "customers", selectedCustomer.id);
            const currentBalance = parseFloat(selectedCustomer.balance || 0);
            const newBalance = currentBalance + cardPaymentData.balance;
            
            transaction.update(customerRef, {
              balance: newBalance,
              lastUpdated: serverTimestamp(),
            });
          }
        }

        transaction.set(newSaleDocRef, saleData);

        for (const itemRead of itemReads) {
          transaction.update(itemRead.ref, {
            stock: itemRead.newStock,
            quantity: itemRead.newStock,
            lastUpdated: serverTimestamp(),
          });
        }
      });

      alert(
        `Sale Completed!\nInvoice #${currentInvoiceNo}\nReceipt ID: ${newSaleDocId}\nTotal: Rs. ${calculateTotal().toFixed(
          2
        )}\n\nInventory Updated Automatically!`
      );
      resetSaleState();
      loadProducts();
      loadCustomers();
    } catch (error) {
      console.error("Sale Transaction failed:", error);
      alert(`Sale failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, quantity: newQty } : item
        )
      );
    }
  };

  const handleItemSelect = (product) => {
    setModal({
      isOpen: true,
      type: "price",
      product: product,
      currentValue: product.price.toFixed(2),
    });
  };

  const handlePriceConfirm = () => {
    const newPrice = parseFloat(modal.currentValue);
    if (isNaN(newPrice) || newPrice <= 0) {
      alert("Invalid price!");
      return;
    }

    const updatedProduct = { ...modal.product, price: newPrice };
    setModal({
      isOpen: true,
      type: "quantity",
      product: updatedProduct,
      currentValue: "1",
    });
  };

  const handleQuantityConfirm = () => {
    const newQuantity = parseFloat(modal.currentValue);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      alert("Invalid quantity!");
      return;
    }

    const itemToAdd = { ...modal.product, quantity: newQuantity };
    const existingIndex = cart.findIndex((item) => item.id === itemToAdd.id);

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex] = {
        ...newCart[existingIndex],
        quantity: newCart[existingIndex].quantity + itemToAdd.quantity,
        price: itemToAdd.price,
      };
      setCart(newCart);
    } else {
      setCart([...cart, itemToAdd]);
    }

    setModal({ isOpen: false, type: null, product: null, currentValue: "0" });
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: THEME.BG,
        color: THEME.TEXT,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* LEFT SIDEBAR - PENDING ORDERS */}
      <div
        style={{
          width: "250px",
          background: THEME.CARD_BG,
          borderRight: `1px solid ${THEME.BORDER}`,
          padding: "15px",
          overflowY: "auto",
        }}
      >
        <h4
          style={{
            margin: "0 0 15px 0",
            borderBottom: `1px solid ${THEME.BORDER}`,
            paddingBottom: "10px",
            color: THEME.WARNING,
          }}
        >
          <span
            style={{
              fontSize: "20px",
              verticalAlign: "middle",
              marginRight: "5px",
            }}
          >
            Pending Orders ({pendingSales.length})
          </span>
        </h4>
        {pendingSales.length === 0 ? (
          <p style={{ fontSize: "12px", color: THEME.TEXT_MUTED }}>
            No orders on hold.
          </p>
        ) : (
          pendingSales.map((sale) => (
            <div
              key={sale.id}
              style={{
                background: THEME.INPUT_BG,
                padding: "10px",
                borderRadius: "4px",
                marginBottom: "10px",
                cursor: "pointer",
                border: `1px solid ${THEME.BORDER}`,
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: THEME.PRIMARY,
                }}
              >
                {sale.customerName}
              </div>
              <div style={{ fontSize: "11px", color: THEME.TEXT_MUTED }}>
                Items: {sale.items.length} | Time: {sale.timestamp}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  margin: "5px 0",
                }}
              >
                Total: Rs. {sale.total.toFixed(2)}
              </div>
              <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                <button
                  onClick={() => handleResumeSale(sale.id)}
                  style={{
                    ...qtyBtnStyle,
                    background: THEME.SUCCESS,
                    flex: 1,
                    padding: "5px 8px",
                  }}
                >
                  Resume
                </button>
                <button
                  onClick={() => handleDeletePendingSale(sale.id)}
                  style={{
                    ...qtyBtnStyle,
                    background: THEME.DANGER,
                    width: "40px",
                    padding: "5px",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div
        style={{
          flex: 1,
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* TOP BUTTONS WITH PREMIUM DESIGN */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
          <button 
            onClick={resetSaleState} 
            style={{ 
              ...topIconBtnStyle, 
              background: `linear-gradient(135deg, ${THEME.DANGER} 0%, #dc2626 100%)`,
              border: "none",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <span style={{ fontSize: "18px" }}>+</span>
            <span>New Sale</span>
          </button>
          
          <button 
            onClick={handleHoldSale} 
            style={{ 
              ...topIconBtnStyle, 
              background: `linear-gradient(135deg, ${THEME.WARNING} 0%, #ea580c 100%)`,
              border: "none",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <span style={{ fontSize: "18px" }}>⏸</span>
            <span>Hold Sale</span>
          </button>
          
          <button 
            onClick={() => setShowFindModal(true)} 
            style={{ 
              ...topIconBtnStyle, 
              background: `linear-gradient(135deg, ${THEME.SUCCESS} 0%, #059669 100%)`,
              border: "none",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <span style={{ fontSize: "18px" }}>🔍</span>
            <span>Find</span>
          </button>
          
          <div style={{ flex: 1 }}></div>
          
          {/* PREMIUM DATE DISPLAY */}
          <div style={{
            background: `linear-gradient(135deg, ${THEME.INPUT_BG} 0%, #1f1f1f 100%)`,
            padding: "10px 16px",
            borderRadius: "10px",
            border: `1px solid ${THEME.BORDER}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}>
            <span style={{ fontSize: "18px" }}>📅</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "10px", color: THEME.TEXT_MUTED, textTransform: "uppercase", letterSpacing: "1px" }}>
                Today
              </span>
              <span style={{ fontSize: "14px", color: THEME.TEXT, fontWeight: "600" }}>
                {new Date().toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
          
          {/* PREMIUM INVOICE NUMBER */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            background: isEditMode 
              ? `linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(234, 88, 12, 0.15) 100%)`
              : `linear-gradient(135deg, ${THEME.INPUT_BG} 0%, #1f1f1f 100%)`,
            padding: "10px 14px",
            borderRadius: "10px",
            border: `1px solid ${isEditMode ? THEME.WARNING : THEME.BORDER}`,
            boxShadow: isEditMode 
              ? "0 4px 12px rgba(245, 158, 11, 0.3)"
              : "0 4px 12px rgba(0,0,0,0.3)",
          }}>
            <button
              onClick={handlePreviousInvoice}
              disabled={!currentInvoiceNo || currentInvoiceNo <= 1}
              style={{
                background: "transparent",
                color: currentInvoiceNo > 1 ? THEME.PRIMARY : THEME.TEXT_MUTED,
                border: "none",
                padding: "4px 8px",
                borderRadius: "6px",
                cursor: currentInvoiceNo > 1 ? "pointer" : "not-allowed",
                fontSize: "16px",
                fontWeight: "bold",
                opacity: currentInvoiceNo > 1 ? 1 : 0.3,
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                if (currentInvoiceNo > 1) {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              ←
            </button>
            
            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              alignItems: "center",
              minWidth: "70px",
              gap: "2px"
            }}>
              <span style={{ 
                fontSize: "10px", 
                color: THEME.TEXT_MUTED,
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: "600"
              }}>
                Invoice
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ 
                  fontSize: "18px", 
                  fontWeight: "bold",
                  background: isEditMode 
                    ? `linear-gradient(135deg, ${THEME.WARNING}, #ea580c)`
                    : `linear-gradient(135deg, ${THEME.PRIMARY}, ${THEME.SECONDARY})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  #{currentInvoiceNo || "---"}
                </span>
                {isEditMode && (
                  <span style={{ 
                    fontSize: "9px", 
                    background: THEME.WARNING,
                    color: "white",
                    padding: "3px 6px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Edit
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={handleNextInvoice}
              disabled={!currentInvoiceNo}
              style={{
                background: "transparent",
                color: currentInvoiceNo ? THEME.PRIMARY : THEME.TEXT_MUTED,
                border: "none",
                padding: "4px 8px",
                borderRadius: "6px",
                cursor: currentInvoiceNo ? "pointer" : "not-allowed",
                fontSize: "16px",
                fontWeight: "bold",
                opacity: currentInvoiceNo ? 1 : 0.3,
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                if (currentInvoiceNo) {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              →
            </button>
          </div>
          
          <button 
            style={{
              ...topIconBtnStyle, 
              background: `linear-gradient(135deg, ${THEME.SECONDARY} 0%, ${THEME.ACCENT} 100%)`,
              border: "none",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <span style={{ fontSize: "18px" }}>⚙️</span>
            <span>Settings</span>
          </button>
        </div>

        {/* SEARCH BAR */}
        <div
          id="search-container"
          style={{ position: "relative", marginBottom: "15px" }}
        >
          <input
            type="text"
            placeholder="Scan barcode or search item name (Press Enter)"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={handleBarcodeSearch}
            style={{ ...inputStyle, padding: "12px", fontSize: "14px" }}
          />

          {isDropdownOpen && filteredProducts.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 100,
                background: THEME.CARD_BG,
                border: `1px solid ${THEME.BORDER}`,
                borderRadius: "4px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleDropdownItemClick(product)}
                  style={{
                    padding: "10px 15px",
                    borderBottom: `1px solid ${THEME.BORDER}`,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background 0.1s",
                    color: THEME.TEXT,
                    fontSize: "14px",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = THEME.INPUT_BG)
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = THEME.CARD_BG)
                  }
                >
                  <div>
                    <div style={{ fontWeight: "bold" }}>{product.itemName}</div>
                    <div style={{ fontSize: "12px", color: THEME.TEXT_MUTED }}>
                      {product.barcode || "No Barcode"} | Stock: {product.stock}
                    </div>
                  </div>
                  <div style={{ fontWeight: "bold", color: THEME.PRIMARY }}>
                    Rs. {product.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CART AREA */}
        <div
          style={{
            flex: 1,
            background: THEME.CARD_BG,
            borderRadius: "4px",
            padding: "15px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* CART HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "15px",
              paddingBottom: "10px",
              borderBottom: `1px solid ${THEME.BORDER}`,
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: THEME.TEXT_MUTED,
                flex: 1,
              }}
            >
              Product name
            </span>
            <div style={{ display: "flex", gap: "10px", minWidth: "300px", justifyContent: "flex-end" }}> 
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: THEME.TEXT_MUTED,
                  minWidth: "70px",
                  textAlign: "center",
                }}
              >
                Qty
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: THEME.TEXT_MUTED,
                  minWidth: "80px",
                  textAlign: "right",
                }}
              >
                Price
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: THEME.TEXT_MUTED,
                  minWidth: "80px",
                  textAlign: "right",
                }}
              >
                Amount
              </span>
              <span style={{ minWidth: "34px" }}></span> 
            </div>
          </div>

          {/* CART ITEMS */}
          {cart.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: THEME.TEXT_MUTED,
                flexGrow: 1,
              }}
            >
              <p style={{ fontSize: "18px", marginBottom: "8px" }}>
                No Items in Current Cart
              </p>
              <p style={{ fontSize: "13px" }}>
                Scan barcode anywhere or search to add items.
              </p>
            </div>
          ) : (
            <div style={{ overflowY: "auto", flex: 1 }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: `1px solid ${THEME.BORDER}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleItemSelect(item)}
                    >
                      {item.itemName}
                    </div>
                    <div style={{ fontSize: "12px", color: THEME.TEXT_MUTED }}>
                      {item.barcode || "No barcode"}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      minWidth: "300px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        alignItems: "center",
                        minWidth: "70px",
                      }}
                    >
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={qtyBtnStyle}
                      >
                        -
                      </button>
                      <span
                        style={{
                          fontWeight: "bold",
                          minWidth: "20px",
                          textAlign: "center",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={qtyBtnStyle}
                      >
                        +
                      </button>
                    </div>
                    <span style={{ minWidth: "80px", textAlign: "right" }}>
                      Rs. {item.price.toFixed(2)}
                    </span>
                    <span
                      style={{
                        minWidth: "80px",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      Rs. {(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: THEME.DANGER,
                        color: "white",
                        border: "none",
                        padding: "6px 8px",
                        borderRadius: "3px",
                        cursor: "pointer",
                        minWidth: "30px",
                        fontSize: "14px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CHECKOUT SECTION */}
          <div style={{ padding: "15px 0", borderTop: `1px solid ${THEME.BORDER}`, marginTop: "15px" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div id="customer-container" style={{ position: "relative", width: "40%" }}>
                    <input
                        type="text"
                        placeholder="Customer Name / Phone"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          setSelectedCustomer(null);
                          const value = e.target.value;
                          if (value.trim().length > 0) {
                            const lowerCaseValue = value.toLowerCase();
                            const filtered = customers.filter(
                              (c) =>
                                c.customerName?.toLowerCase().includes(lowerCaseValue) ||
                                c.phone?.includes(value.trim())
                            );
                            setFilteredCustomers(filtered);
                            setIsCustomerDropdownOpen(filtered.length > 0);
                          } else {
                            setFilteredCustomers([]);
                            setIsCustomerDropdownOpen(false);
                          }
                        }}
                        style={{ ...inputStyle, padding: "8px", fontSize: "13px" }}
                    />
                     {isCustomerDropdownOpen && filteredCustomers.length > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                zIndex: 100,
                                background: THEME.CARD_BG,
                                border: `1px solid ${THEME.BORDER}`,
                                borderRadius: "4px",
                                boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
                                maxHeight: "150px",
                                overflowY: "auto",
                            }}
                        >
                            {filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    onClick={() => handleCustomerSelect(customer)}
                                    style={{
                                        padding: "8px 10px",
                                        borderBottom: `1px solid ${THEME.BORDER}`,
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        transition: "background 0.1s",
                                    }}
                                    onMouseOver={(e) =>
                                      (e.currentTarget.style.background = THEME.INPUT_BG)
                                    }
                                    onMouseOut={(e) =>
                                      (e.currentTarget.style.background = THEME.CARD_BG)
                                    }
                                >
                                    <div style={{ fontWeight: "bold" }}>
                                      {customer.customerName}
                                      <span style={{ 
                                        marginLeft: "8px", 
                                        fontSize: "10px", 
                                        background: customer.customerType === 'Credit' ? THEME.WARNING : THEME.SUCCESS,
                                        padding: "2px 6px",
                                        borderRadius: "10px",
                                        color: "white"
                                      }}>
                                        {customer.customerType}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: "11px", color: THEME.TEXT_MUTED }}>
                                      {customer.phone}
                                      {customer.customerType === 'Credit' && customer.balance && (
                                        <span style={{ marginLeft: "8px", color: THEME.DANGER }}>
                                          | Balance: Rs. {parseFloat(customer.balance || 0).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '10px', width: "55%", justifyContent: "flex-end" }}>
                    <input
                        type="number"
                        placeholder="Discount (Rs.)"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        style={{ ...inputStyle, padding: "8px", fontSize: "13px", width: "100px" }}
                    />
                    <input
                        type="number"
                        placeholder="Tax (%)"
                        value={taxRate}
                        onChange={handleTaxRateChange}
                        style={{ ...inputStyle, padding: "8px", fontSize: "13px", width: "80px" }}
                    />
                </div>
            </div>

            <div style={{ maxWidth: "400px", marginLeft: "auto" }}>
                <div style={summaryRow}>
                    <span style={{ color: THEME.TEXT_MUTED }}>Subtotal:</span>
                    <span style={{ fontWeight: "bold" }}>Rs. {calculateSubtotal().toFixed(2)}</span>
                </div>
                <div style={summaryRow}>
                    <span style={{ color: THEME.TEXT_MUTED }}>Tax ({taxRate}%):</span>
                    <span style={{ fontWeight: "bold" }}>Rs. {calculateTax().toFixed(2)}</span>
                </div>
                <div style={summaryRow}>
                    <span style={{ color: THEME.DANGER }}>Discount:</span>
                    <span style={{ fontWeight: "bold", color: THEME.DANGER }}>- Rs. {discount.toFixed(2)}</span>
                </div>
                <div
                    style={{
                        ...summaryRow,
                        marginTop: "10px",
                        paddingTop: "10px",
                        borderTop: `1px dashed ${THEME.BORDER}`,
                        fontSize: "18px",
                    }}
                >
                    <span style={{ fontWeight: "bold", color: THEME.PRIMARY }}>GRAND TOTAL:</span>
                    <span style={{ fontWeight: "bold", color: THEME.PRIMARY }}>Rs. {calculateTotal().toFixed(2)}</span>
                </div>
                
                <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                  <button
                    onClick={handleCashPayment}
                    disabled={cart.length === 0 || loading}
                    style={{
                      flex: 1,
                      padding: "15px",
                      background: loading || cart.length === 0 ? THEME.TEXT_MUTED : THEME.SUCCESS,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      cursor: loading || cart.length === 0 ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    Cash
                  </button>
                  <button
                    onClick={handleCreditCardPayment}
                    disabled={cart.length === 0 || loading}
                    style={{
                      flex: 1,
                      padding: "15px",
                      background: loading || cart.length === 0 ? THEME.TEXT_MUTED : THEME.PRIMARY,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      cursor: loading || cart.length === 0 ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    Credit Card
                  </button>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <FindSalesModal
        isOpen={showFindModal}
        onClose={() => setShowFindModal(false)}
        db={db}
        onLoadInvoice={loadInvoiceByNumber}
      />

      <CashPaymentModal
        isOpen={showCashModal}
        totalAmount={calculateTotal()}
        onConfirm={handlePayment}
        onClose={() => setShowCashModal(false)}
      />

      <CreditCardPaymentModal
        isOpen={showCardModal}
        grandTotal={calculateTotal()}
        customer={selectedCustomer}
        onConfirm={handlePayment}
        onClose={() => setShowCardModal(false)}
      />

      <KeypadModal
        isOpen={modal.isOpen}
        type={modal.type}
        product={modal.product}
        currentValue={modal.currentValue}
        onUpdate={(v) => setModal({ ...modal, currentValue: v })}
        onConfirm={modal.type === "price" ? handlePriceConfirm : handleQuantityConfirm}
        onClose={() =>
          setModal({ isOpen: false, type: null, product: null, currentValue: "0" })
        }
      />
    </div>
  );
};

export default Sale;