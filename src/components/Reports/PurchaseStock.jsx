import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";

const formatDate = (date) => {
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

const getStyles = (theme) => ({
  container: {
    padding: "30px",
    background: theme.BODY_BG,
    color: theme.TEXT_PRIMARY,
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "30px",
    paddingBottom: "15px",
    borderBottom: `1px solid ${theme.SIDEBAR_HOVER}`,
  },
  title: {
    fontSize: "30px",
    fontWeight: "700",
    margin: "0",
    color: theme.TEXT_PRIMARY,
  },
  reportBox: {
    background: theme.CARD_BG,
    borderRadius: "16px",
    padding: "30px",
    boxShadow: theme.SHADOW_MD,
    border: `1px solid ${theme.SIDEBAR_HOVER}`,
    marginBottom: "30px",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "1.5fr 2fr",
    gap: "15px 30px",
    alignItems: "end"
  },
  filterGroup: {
    marginBottom: "15px",
  },
  filterLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: theme.TEXT_SECONDARY,
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: `1px solid ${theme.SIDEBAR_HOVER}`,
    background: theme.SIDEBAR_BG,
    color: theme.TEXT_PRIMARY,
    fontSize: "14px",
    boxSizing: "border-box",
  },
  radioContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px",
    cursor: "pointer",
  },
  buttonContainer: {
    marginTop: "30px",
    display: "flex",
    gap: "15px",
    justifyContent: "flex-end",
  },
  button: {
    padding: "12px 28px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s",
    background: theme.GRADIENT_PRIMARY,
    color: "white",
    boxShadow: `0 4px 12px rgba(239, 68, 68, 0.3)`,
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    textAlign: "left",
    padding: "12px 15px",
    borderBottom: `2px solid ${theme.PRIMARY}`,
    color: theme.TEXT_PRIMARY,
    fontWeight: "700",
    background: theme.SIDEBAR_HOVER,
  },
  td: {
    padding: "12px 15px",
    borderBottom: `1px solid ${theme.SIDEBAR_HOVER}`,
    color: theme.TEXT_SECONDARY,
  },
  summaryBox: {
    background: theme.SIDEBAR_BG,
    padding: "20px",
    borderRadius: "12px",
    marginTop: "20px",
    border: `1px solid ${theme.SIDEBAR_HOVER}`,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: `1px solid ${theme.SIDEBAR_HOVER}`,
    fontSize: "15px",
  },
  summaryTotal: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 0",
    fontSize: "18px",
    fontWeight: "700",
    color: theme.PRIMARY,
    marginTop: "10px",
  },
});

function PurchaseStock({ db, currentTheme }) {
  const styles = getStyles(currentTheme);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [filter, setFilter] = useState({
    allVendors: true,
    selectVendor: "",
    dateFrom: formatDate(thirtyDaysAgo),
    dateTo: formatDate(new Date()),
  });

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [summary, setSummary] = useState({
    totalPurchases: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalBalance: 0,
  });

  const loadVendors = async () => {
    try {
      const vendorsCol = collection(db, "vendors");
      const vendorSnapshot = await getDocs(vendorsCol);
      const vendorList = vendorSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVendors(vendorList);
    } catch (error) {
      console.error("Error loading vendors:", error);
    }
  };

  useEffect(() => {
    if (db) {
      loadVendors();
      loadReportData();
    }
  }, [db]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const purchasesCol = collection(db, "purchases");
      const purchaseSnapshot = await getDocs(purchasesCol);
      
      const dateFromObj = new Date(filter.dateFrom);
      dateFromObj.setHours(0, 0, 0, 0);
      
      const dateToObj = new Date(filter.dateTo);
      dateToObj.setHours(23, 59, 59, 999);

      let purchaseList = [];
      
      purchaseSnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        let purchaseDate;
        if (data.purchaseDate instanceof Timestamp) {
          purchaseDate = data.purchaseDate.toDate();
        } else if (typeof data.purchaseDate === 'string') {
          purchaseDate = new Date(data.purchaseDate);
        } else {
          purchaseDate = new Date();
        }
        
        if (purchaseDate >= dateFromObj && purchaseDate <= dateToObj) {
          const itemDetails = data.itemDetails || [];
          
          itemDetails.forEach(item => {
            const purchaseRecord = {
              id: doc.id,
              purchaseDate: formatDate(purchaseDate),
              vendorName: data.vendorName || "N/A",
              vendorInvoiceNo: data.vendorInvoiceNo || "N/A",
              itemName: item.itemName || "Unknown",
              quantity: parseFloat(item.quantity || 0),
              purchasePrice: parseFloat(item.purchasePrice || 0),
              subtotal: parseFloat(item.subtotal || 0),
              netTotal: parseFloat(data.netTotal || 0),
              amountPaid: parseFloat(data.amountPaid || 0),
              balance: parseFloat(data.balance || 0),
            };
            
            if (!filter.allVendors && filter.selectVendor) {
              if (data.vendorName === filter.selectVendor) {
                purchaseList.push(purchaseRecord);
              }
            } else if (filter.allVendors) {
              purchaseList.push(purchaseRecord);
            }
          });
        }
      });

      purchaseList.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

      const uniquePurchases = {};
      purchaseList.forEach(item => {
        const key = `${item.id}`;
        if (!uniquePurchases[key]) {
          uniquePurchases[key] = {
            netTotal: item.netTotal,
            amountPaid: item.amountPaid,
            balance: item.balance
          };
        }
      });

      const totalAmount = Object.values(uniquePurchases).reduce((sum, p) => sum + p.netTotal, 0);
      const totalPaid = Object.values(uniquePurchases).reduce((sum, p) => sum + p.amountPaid, 0);
      const totalBalance = Object.values(uniquePurchases).reduce((sum, p) => sum + p.balance, 0);

      setSummary({
        totalPurchases: Object.keys(uniquePurchases).length,
        totalAmount,
        totalPaid,
        totalBalance,
      });

      setReportData(purchaseList);
    } catch (error) {
      console.error("Error loading purchases:", error);
      alert("Error loading purchase data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (db) {
      loadReportData();
    }
  }, [filter]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📦 Purchase Stock Report</h1>
      </div>

      <div style={styles.reportBox}>
        <div style={styles.filterGrid}>
          <div style={styles.filterGroup}>
            <div style={styles.radioContainer} onClick={() => setFilter(prev => ({ ...prev, allVendors: true, selectVendor: "" }))}>
              <input 
                type="radio" 
                name="vendorFilter" 
                checked={filter.allVendors} 
                onChange={() => {}} 
                style={{ accentColor: currentTheme.PRIMARY }} 
              />
              <span style={{ marginLeft: "8px", color: currentTheme.TEXT_PRIMARY, fontWeight: "600" }}>
                All Vendors
              </span>
            </div>

            <div style={styles.radioContainer} onClick={() => setFilter(prev => ({ ...prev, allVendors: false }))}>
              <input 
                type="radio" 
                name="vendorFilter" 
                checked={!filter.allVendors} 
                onChange={() => {}} 
                style={{ accentColor: currentTheme.PRIMARY }} 
              />
              <span style={{ marginLeft: "8px", color: currentTheme.TEXT_PRIMARY, fontWeight: "600" }}>
                Select Vendor
              </span>
            </div>

            <select
              value={filter.selectVendor}
              onChange={(e) => setFilter(prev => ({ ...prev, selectVendor: e.target.value, allVendors: false }))}
              disabled={filter.allVendors}
              style={{ ...styles.input, marginTop: "5px", opacity: filter.allVendors ? 0.5 : 1 }}
            >
              <option value="">-- Select Vendor --</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.vendorName}>
                  {vendor.vendorName}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={styles.filterLabel}>From</label>
                <input 
                  type="date" 
                  value={filter.dateFrom} 
                  onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))} 
                  style={styles.input} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.filterLabel}>To</label>
                <input 
                  type="date" 
                  value={filter.dateTo} 
                  onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))} 
                  style={styles.input} 
                />
              </div>
              <button 
                onClick={loadReportData} 
                disabled={loading} 
                style={{ ...styles.button, flex: 0.5, minWidth: '120px' }}
              >
                {loading ? "Loading..." : "Display"}
              </button>
            </div>
          </div>
        </div>

        <div style={styles.summaryBox}>
          <div style={styles.summaryRow}>
            <span style={{ color: currentTheme.TEXT_SECONDARY }}>Total Purchases:</span>
            <span style={{ fontWeight: "700", color: currentTheme.TEXT_PRIMARY }}>
              {summary.totalPurchases}
            </span>
          </div>
          <div style={styles.summaryRow}>
            <span style={{ color: currentTheme.TEXT_SECONDARY }}>Total Amount:</span>
            <span style={{ fontWeight: "700", color: currentTheme.ACCENT_INFO }}>
              Rs {summary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div style={styles.summaryRow}>
            <span style={{ color: currentTheme.TEXT_SECONDARY }}>Total Paid:</span>
            <span style={{ fontWeight: "700", color: currentTheme.ACCENT_SUCCESS }}>
              Rs {summary.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div style={styles.summaryTotal}>
            <span>Total Balance Due:</span>
            <span style={{ color: currentTheme.PRIMARY }}>
              Rs {summary.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.reportBox}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Invoice No</th>
                <th style={styles.th}>Vendor</th>
                <th style={styles.th}>Item Name</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Quantity</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Unit Price</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ ...styles.td, textAlign: "center", padding: "30px" }}>
                    Loading...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ ...styles.td, textAlign: "center", padding: "30px" }}>
                    No purchase data found for the selected period.
                  </td>
                </tr>
              ) : (
                reportData.map((item, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{item.purchaseDate}</td>
                    <td style={styles.td}>{item.vendorInvoiceNo}</td>
                    <td style={styles.td}>
                      <strong>{item.vendorName}</strong>
                    </td>
                    <td style={styles.td}>{item.itemName}</td>
                    <td style={{ ...styles.td, textAlign: "center", fontWeight: "600" }}>
                      {item.quantity}
                    </td>
                    <td style={{ ...styles.td, textAlign: "right", color: currentTheme.ACCENT_INFO }}>
                      Rs {item.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: currentTheme.ACCENT_SUCCESS }}>
                      Rs {item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PurchaseStock;