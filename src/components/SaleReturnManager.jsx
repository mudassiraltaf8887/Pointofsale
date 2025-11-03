import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  runTransaction,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

// ❌ THEME object DELETE ho gaya

// ✅ currentTheme prop add kiya
const SaleReturnManager = ({ db, currentTheme }) => {
  const [salesData, setSalesData] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSales, setLoadingSales] = useState(true);
  const [returnHistory, setReturnHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("return");
  const [searchFilters, setSearchFilters] = useState({
    invoiceNo: "",
    customerName: "",
  });

  useEffect(() => {
    loadAllSales();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      loadReturnHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [searchFilters, salesData]);

  const loadAllSales = async () => {
    setLoadingSales(true);
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
          total: data.total || 0,
          customerId: data.customerId || null,
          customerType: data.customerType || "Cash",
          createdAt: data.createdAt,
          items: data.items || [],
          date: data.createdAt?.toDate
            ? data.createdAt.toDate().toLocaleDateString()
            : "N/A",
        };
      });

      setSalesData(salesList);
      setFilteredSales(salesList);
    } catch (error) {
      console.error("Error loading sales:", error);
      alert("Failed to load sales data!");
    } finally {
      setLoadingSales(false);
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
        sale.customerName
          .toLowerCase()
          .includes(searchFilters.customerName.toLowerCase())
      );
    }

    setFilteredSales(filtered);
  };

  const handleFilterChange = (field, value) => {
    setSearchFilters({ ...searchFilters, [field]: value });
  };

  const loadReturnHistory = async () => {
    try {
      const returnsCol = collection(db, "saleReturns");
      const q = query(returnsCol, orderBy("createdAt", "desc"), limit(50));
      const returnsSnapshot = await getDocs(q);

      const returnsList = returnsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.createdAt?.toDate
            ? data.createdAt.toDate().toLocaleDateString()
            : "N/A",
          time: data.createdAt?.toDate
            ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : "N/A",
        };
      });

      setReturnHistory(returnsList);
    } catch (error) {
      console.error("Error loading return history:", error);
    }
  };

  const handleLoadInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    const itemsWithReturn = invoice.items.map((item) => ({
      ...item,
      returnQuantity: 0,
      maxQuantity: item.quantity,
    }));
    setReturnItems(itemsWithReturn);
  };

  const handleReturnQuantityChange = (index, value) => {
    const newReturnItems = [...returnItems];
    const qty = parseInt(value) || 0;
    const maxQty = newReturnItems[index].maxQuantity;

    if (qty > maxQty) {
      alert(`Return quantity cannot exceed ${maxQty}!`);
      return;
    }

    newReturnItems[index].returnQuantity = qty;
    setReturnItems(newReturnItems);
  };

  const calculateReturnTotal = () => {
    return returnItems.reduce(
      (sum, item) => sum + item.returnQuantity * item.price,
      0
    );
  };

  const handleProcessReturn = async () => {
    const itemsToReturn = returnItems.filter((item) => item.returnQuantity > 0);

    if (itemsToReturn.length === 0) {
      alert("Please select at least one item with return quantity!");
      return;
    }

    const returnTotal = calculateReturnTotal();

    if (
      !window.confirm(
        `Process return of Rs. ${returnTotal.toFixed(2)}?\n\nThis will:\n✅ Add stock back to inventory\n✅ Create return record\n✅ Update customer balance (if credit)`
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        for (const item of itemsToReturn) {
          const itemRef = doc(db, "items", item.id);
          const itemDoc = await transaction.get(itemRef);

          if (!itemDoc.exists()) {
            throw new Error(`Product "${item.name}" not found!`);
          }

          const itemData = itemDoc.data();
          const currentStock = parseFloat(itemData.stock || itemData.quantity || 0);
          const returnQty = parseFloat(item.returnQuantity);
          const newStock = currentStock + returnQty;

          transaction.update(itemRef, {
            stock: newStock,
            quantity: newStock,
            lastUpdated: serverTimestamp(),
          });
        }

        const returnData = {
          originalInvoiceNo: selectedInvoice.invoiceNo,
          originalSaleId: selectedInvoice.id,
          customerName: selectedInvoice.customerName,
          customerId: selectedInvoice.customerId || null,
          originalSaleTotal: selectedInvoice.total,
          returnItems: itemsToReturn.map((item) => ({
            id: item.id,
            itemCode: item.itemCode,
            name: item.name,
            returnQuantity: item.returnQuantity,
            price: item.price,
            amount: item.returnQuantity * item.price,
          })),
          returnTotal: returnTotal,
          createdAt: serverTimestamp(),
          status: "completed",
        };

        const returnRef = doc(collection(db, "saleReturns"));
        transaction.set(returnRef, returnData);

        if (selectedInvoice.customerId && selectedInvoice.customerType === "Credit") {
          const customerRef = doc(db, "customers", selectedInvoice.customerId);
          const customerDoc = await transaction.get(customerRef);

          if (customerDoc.exists()) {
            const currentBalance = parseFloat(customerDoc.data().balance || 0);
            const newBalance = currentBalance - returnTotal;

            transaction.update(customerRef, {
              balance: newBalance,
              lastUpdated: serverTimestamp(),
            });

            const balanceTxnData = {
              customerId: selectedInvoice.customerId,
              type: "SaleReturn",
              amount: -returnTotal,
              currentBalance: newBalance,
              originalSaleId: selectedInvoice.id,
              returnId: returnRef.id,
              description: `Return for Invoice #${selectedInvoice.invoiceNo}`,
              createdAt: serverTimestamp(),
            };
            const balanceTxnRef = doc(collection(db, "balanceTransactions"));
            transaction.set(balanceTxnRef, balanceTxnData);
          }
        }
      });

      alert(`✅ Return Processed!\n\nAmount: Rs. ${returnTotal.toFixed(2)}\n📦 Stock Updated\n💰 Balance Adjusted`);

      setSelectedInvoice(null);
      setReturnItems([]);
      setActiveTab("history");
      loadReturnHistory();
    } catch (error) {
      console.error("Return failed:", error);
      alert(`Return failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearReturn = () => {
    setSelectedInvoice(null);
    setReturnItems([]);
  };

  return (
    <div style={{ padding: "30px", background: currentTheme.BODY_BG, minHeight: "100vh", color: currentTheme.TEXT_PRIMARY, fontFamily: "Arial, sans-serif" }}>
      {/* HEADER */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ margin: "0 0 5px 0", fontSize: "32px", fontWeight: "800", color: currentTheme.TEXT_PRIMARY }}>
          🔄 Sale Return Management
        </h1>
        <p style={{ margin: 0, color: currentTheme.TEXT_MUTED, fontSize: "15px" }}>
          Process customer returns, adjust inventory, and manage refund history.
        </p>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}`, marginBottom: "30px" }}>
        <button
          onClick={() => setActiveTab("return")}
          style={{
            padding: "10px 20px",
            background: "none",
            color: activeTab === "return" ? currentTheme.PRIMARY : currentTheme.TEXT_MUTED,
            border: "none",
            borderBottom: activeTab === "return" ? `3px solid ${currentTheme.PRIMARY}` : "none",
            fontWeight: activeTab === "return" ? "bold" : "normal",
            cursor: "pointer",
            fontSize: "16px",
            marginBottom: "-2px",
            transition: "color 0.15s",
          }}
        >
          Process New Return
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: "10px 20px",
            background: "none",
            color: activeTab === "history" ? currentTheme.PRIMARY : currentTheme.TEXT_MUTED,
            border: "none",
            borderBottom: activeTab === "history" ? `3px solid ${currentTheme.PRIMARY}` : "none",
            fontWeight: activeTab === "history" ? "bold" : "normal",
            cursor: "pointer",
            fontSize: "16px",
            marginBottom: "-2px",
            transition: "color 0.15s",
          }}
        >
          Return History ({returnHistory.length})
        </button>
      </div>

      {/* PROCESS RETURN TAB */}
      {activeTab === "return" && (
        <div style={{ display: "flex", gap: "30px" }}>
          {/* LEFT: INVOICE LIST */}
          <div style={{ flex: "0 0 400px", background: currentTheme.CARD_BG, borderRadius: "12px", padding: "20px", boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "20px", fontWeight: "600", color: currentTheme.TEXT_PRIMARY, borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}`, paddingBottom: "10px" }}>
              🔍 Search Sales
            </h3>

            {/* SEARCH FILTERS */}
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Search Invoice No..."
                value={searchFilters.invoiceNo}
                onChange={(e) => handleFilterChange("invoiceNo", e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: currentTheme.SIDEBAR_BG,
                  border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                  borderRadius: "8px",
                  color: currentTheme.TEXT_PRIMARY,
                  fontSize: "15px",
                  marginBottom: "10px",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="text"
                placeholder="Search Customer..."
                value={searchFilters.customerName}
                onChange={(e) => handleFilterChange("customerName", e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: currentTheme.SIDEBAR_BG,
                  border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                  borderRadius: "8px",
                  color: currentTheme.TEXT_PRIMARY,
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* INVOICES LIST */}
            <div style={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto", borderTop: `1px solid ${currentTheme.SIDEBAR_HOVER}`, paddingTop: "10px" }}>
              {loadingSales ? (
                <div style={{ textAlign: "center", padding: "40px", color: currentTheme.TEXT_MUTED }}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>⏳</div>
                  Loading Sales Data...
                </div>
              ) : filteredSales.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: currentTheme.TEXT_MUTED }}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>📭</div>
                  No matching invoices found.
                </div>
              ) : (
                filteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => handleLoadInvoice(sale)}
                    style={{
                      background: selectedInvoice?.id === sale.id ? currentTheme.SIDEBAR_BG : currentTheme.CARD_BG,
                      color: selectedInvoice?.id === sale.id ? currentTheme.PRIMARY : currentTheme.TEXT_PRIMARY,
                      padding: "15px",
                      borderRadius: "10px",
                      marginBottom: "10px",
                      cursor: "pointer",
                      border: `1px solid ${selectedInvoice?.id === sale.id ? currentTheme.PRIMARY : currentTheme.SIDEBAR_HOVER}`,
                      transition: "all 0.2s",
                      boxShadow: selectedInvoice?.id === sale.id ? `0 0 0 1px ${currentTheme.PRIMARY}` : "none",
                    }}
                    onMouseOver={(e) => {
                      if (selectedInvoice?.id !== sale.id) {
                        e.currentTarget.style.backgroundColor = currentTheme.SIDEBAR_BG;
                        e.currentTarget.style.borderColor = currentTheme.TEXT_MUTED;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedInvoice?.id !== sale.id) {
                        e.currentTarget.style.backgroundColor = currentTheme.CARD_BG;
                        e.currentTarget.style.borderColor = currentTheme.SIDEBAR_HOVER;
                      }
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "700", marginBottom: "3px", fontSize: "16px", color: selectedInvoice?.id === sale.id ? currentTheme.PRIMARY : currentTheme.TEXT_PRIMARY }}>
                          #{sale.invoiceNo}
                        </div>
                        <div style={{ fontSize: "13px", color: currentTheme.TEXT_MUTED }}>
                          {sale.customerName}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: "bold", fontSize: "18px", color: selectedInvoice?.id === sale.id ? currentTheme.PRIMARY : currentTheme.TEXT_PRIMARY }}>
                          Rs. {sale.total.toFixed(0)}
                        </div>
                        <div style={{ fontSize: "11px", color: currentTheme.TEXT_MUTED }}>
                          {sale.date}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: RETURN DETAILS */}
          <div style={{ flex: 1, background: currentTheme.CARD_BG, borderRadius: "12px", padding: "30px", boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}>
            {!selectedInvoice ? (
              <div style={{ textAlign: "center", padding: "100px 20px", color: currentTheme.TEXT_MUTED }}>
                <div style={{ fontSize: "64px", marginBottom: "20px" }}>🧾</div>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "22px", color: currentTheme.TEXT_PRIMARY }}>Select a Sale Invoice</h3>
                <p style={{ margin: 0, fontSize: "16px" }}>Choose an invoice from the left panel to begin the return process.</p>
              </div>
            ) : (
              <div>
                {/* INVOICE INFO */}
                <div style={{ background: currentTheme.SIDEBAR_BG, padding: "20px", borderRadius: "10px", marginBottom: "25px", borderLeft: `5px solid ${currentTheme.PRIMARY}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ marginBottom: "5px" }}>
                        <span style={{ background: currentTheme.PRIMARY, color: "white", padding: "6px 15px", borderRadius: "6px", fontWeight: "bold", marginRight: "10px", fontSize: "15px" }}>
                          INV #{selectedInvoice.invoiceNo}
                        </span>
                        <span style={{ fontSize: "20px", fontWeight: "700" }}>{selectedInvoice.customerName}</span>
                      </div>
                      <div style={{ fontSize: "14px", color: currentTheme.TEXT_MUTED }}>
                        Total: Rs. {selectedInvoice.total.toFixed(2)} | Date: {selectedInvoice.date} | Payment: **{selectedInvoice.customerType}**
                      </div>
                    </div>
                    <button onClick={handleClearReturn} style={{ padding: "10px 20px", background: currentTheme.SIDEBAR_BG, color: currentTheme.PRIMARY, border: `1px solid ${currentTheme.PRIMARY}`, borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "background 0.2s" }}
                      onMouseOver={(e) => { e.currentTarget.style.background = currentTheme.PRIMARY; e.currentTarget.style.color = "white"; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = currentTheme.SIDEBAR_BG; e.currentTarget.style.color = currentTheme.PRIMARY; }}
                      >
                      🗑️ Clear Selection
                    </button>
                  </div>
                </div>

                {/* ITEMS TABLE */}
                <div style={{ overflowX: "auto", marginBottom: "30px", border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: "10px" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ background: currentTheme.SIDEBAR_BG }}>
                        <th style={{ padding: "15px", textAlign: "left", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>Item Name</th>
                        <th style={{ padding: "15px", textAlign: "center", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>Sold Qty</th>
                        <th style={{ padding: "15px", textAlign: "right", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>Price</th>
                        <th style={{ padding: "15px", textAlign: "center", color: currentTheme.PRIMARY, fontSize: "13px", textTransform: "uppercase", fontWeight: "700", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>🔙 Return Qty</th>
                        <th style={{ padding: "15px", textAlign: "right", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>Refund Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnItems.map((item, index) => (
                        <tr key={index} style={{ background: index % 2 === 0 ? currentTheme.CARD_BG : currentTheme.SIDEBAR_BG }}>
                          <td style={{ padding: "15px", borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                            <div style={{ fontWeight: "600" }}>{item.name}</div>
                            <div style={{ fontSize: "11px", color: currentTheme.TEXT_MUTED }}>Code: {item.itemCode}</div>
                          </td>
                          <td style={{ padding: "15px", textAlign: "center", borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}`, color: currentTheme.PRIMARY, fontWeight: "600" }}>{item.quantity}</td>
                          <td style={{ padding: "15px", textAlign: "right", borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}`, color: currentTheme.TEXT_MUTED }}>Rs. {item.price.toFixed(2)}</td>
                          <td style={{ padding: "15px", textAlign: "center", borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                            <input
                              type="number"
                              min="0"
                              max={item.maxQuantity}
                              value={item.returnQuantity}
                              onChange={(e) => handleReturnQuantityChange(index, e.target.value)}
                              style={{ 
                                width: "80px", 
                                padding: "8px", 
                                background: currentTheme.BODY_BG, 
                                border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, 
                                borderRadius: "6px", 
                                color: currentTheme.TEXT_PRIMARY, 
                                textAlign: "center", 
                                fontSize: "15px", 
                                fontWeight: "600" 
                              }}
                            />
                          </td>
                          <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold", fontSize: "17px", color: item.returnQuantity > 0 ? currentTheme.PRIMARY : currentTheme.TEXT_PRIMARY, borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                            Rs. {(item.returnQuantity * item.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* RETURN SUMMARY & ACTION */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: currentTheme.SIDEBAR_BG, padding: "25px", borderRadius: "10px", border: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                  <div>
                    <div style={{ fontSize: "18px", color: currentTheme.TEXT_MUTED, marginBottom: "8px" }}>Total Refund Amount:</div>
                    <div style={{ fontSize: "38px", fontWeight: "800", color: currentTheme.PRIMARY }}>Rs. {calculateReturnTotal().toFixed(2)}</div>
                  </div>
                  <button
                    onClick={handleProcessReturn}
                    disabled={loading || calculateReturnTotal() === 0}
                    style={{ 
                      padding: "18px 45px", 
                      background: loading || calculateReturnTotal() === 0 ? currentTheme.TEXT_MUTED : currentTheme.ACCENT_SUCCESS, 
                      color: "white", 
                      border: "none", 
                      borderRadius: "8px", 
                      fontSize: "20px", 
                      fontWeight: "bold", 
                      cursor: loading || calculateReturnTotal() === 0 ? "not-allowed" : "pointer",
                      transition: "background 0.2s",
                      boxShadow: loading || calculateReturnTotal() === 0 ? "none" : `0 4px 10px rgba(16, 185, 129, 0.4)`
                    }}
                  >
                    {loading ? "Processing... ⏳" : "✅ Process Return"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div style={{ background: currentTheme.CARD_BG, borderRadius: "12px", padding: "30px", boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "600", color: currentTheme.TEXT_PRIMARY, borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}`, paddingBottom: "10px" }}>Recent Returns History</h3>
          <div style={{ overflowX: "auto", border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: "10px" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: currentTheme.SIDEBAR_BG }}>
                  {["Original Invoice", "Customer Name", "Items Count", "Date & Time", "Refund Amount"].map((h) => (
                    <th key={h} style={{ padding: "15px", textAlign: "left", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returnHistory.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "40px", color: currentTheme.TEXT_MUTED }}>No returns recorded yet.</td></tr>
                ) : (
                  returnHistory.map((ret, i) => (
                    <tr key={ret.id} style={{ background: i % 2 === 0 ? currentTheme.CARD_BG : currentTheme.SIDEBAR_BG, borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                      <td style={{ padding: "15px", fontWeight: "700", color: currentTheme.PRIMARY }}>#{ret.originalInvoiceNo}</td>
                      <td style={{ padding: "15px" }}>{ret.customerName}</td>
                      <td style={{ padding: "15px", textAlign: "center", color: currentTheme.TEXT_MUTED }}>{ret.returnItems.length}</td>
                      <td style={{ padding: "15px", color: currentTheme.TEXT_MUTED }}>{ret.date} @ {ret.time}</td>
                      <td style={{ padding: "15px", fontWeight: "bold", color: currentTheme.PRIMARY, textAlign: "right", fontSize: "18px" }}>Rs. {ret.returnTotal.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleReturnManager;