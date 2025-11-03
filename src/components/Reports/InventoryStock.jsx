import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";

// ❌ THEME object DELETE ho gaya

const formatDate = (date) => {
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

// ✅ getStyles function ab currentTheme use karega
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
  footerBar: {
    background: theme.PRIMARY,
    color: "white",
    padding: "15px 30px",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px",
    fontSize: "16px",
    fontWeight: "600",
  },
});

const calculateBalances = (allItems, allPurchases, allSales, dateFrom, dateTo) => {
  const dateFromObj = new Date(dateFrom);
  dateFromObj.setHours(0, 0, 0, 0); 
  
  const dateToObj = new Date(dateTo);
  dateToObj.setHours(23, 59, 59, 999);

  const reportData = allItems.map(item => {
    const itemCode = item.itemCode;
    const currentStock = parseFloat(item.stock || item.quantity || 0);
    
    let quantityInPeriod = 0; 
    let quantityOutPeriod = 0;

    allPurchases.forEach(purchase => {
      if (purchase.itemCode === itemCode) {
        const purchaseDate = purchase.purchaseDate instanceof Timestamp 
          ? purchase.purchaseDate.toDate() 
          : new Date(purchase.purchaseDate);
        purchaseDate.setHours(12, 0, 0, 0);
        
        const qty = parseFloat(purchase.quantity || 0);
        if (purchaseDate >= dateFromObj && purchaseDate <= dateToObj) {
          quantityInPeriod += qty;
        }
      }
    });

    allSales.forEach(sale => {
      if (sale.itemCode === itemCode) {
        const saleDate = sale.saleDate instanceof Timestamp 
          ? sale.saleDate.toDate() 
          : new Date(sale.saleDate);
        saleDate.setHours(12, 0, 0, 0);

        const qty = parseFloat(sale.quantity || 0);
        if (saleDate >= dateFromObj && saleDate <= dateToObj) {
          quantityOutPeriod += qty; 
        }
      }
    });

    const openingBalance = currentStock - quantityInPeriod + quantityOutPeriod;
    const closingBalance = openingBalance + quantityInPeriod - quantityOutPeriod;
    
    const cost = parseFloat(item.purchasePrice || 0);
    const value = closingBalance > 0 ? closingBalance * cost : 0;

    return {
      itemCode,
      itemName: item.itemName || "Unknown",
      category: item.category || "",
      openingBalance: openingBalance.toFixed(2),
      quantityIn: quantityInPeriod.toFixed(2),
      quantityOut: quantityOutPeriod.toFixed(2),
      closingBalance: closingBalance.toFixed(2),
      unit: item.unit || "Pcs",
      cost: cost.toFixed(2),
      value: value.toFixed(2),
    };
  });

  const totalValue = reportData.reduce((sum, item) => sum + parseFloat(item.value), 0).toFixed(2);

  return { reportItems: reportData, totalValue };
};

// ✅ currentTheme prop add kiya
function InventoryStock({ db, items = [], selectedCategory = "", currentTheme }) {
  const styles = getStyles(currentTheme);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [filter, setFilter] = useState({
    allInventory: true,
    selectCategory: "",
    dateFrom: formatDate(thirtyDaysAgo),
    dateTo: formatDate(new Date()),
  });

  const [reportData, setReportData] = useState({ reportItems: [], totalValue: "0.00" });
  const [loading, setLoading] = useState(false);
  const [allPurchases, setAllPurchases] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [categories, setCategories] = useState([]); 

  const loadCategories = async () => {
    try {
      const categoriesCol = collection(db, "categories");
      const categorySnapshot = await getDocs(categoriesCol);
      const categoryList = categorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoryList);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  useEffect(() => {
    if (db) loadCategories();
  }, [db]);

  useEffect(() => {
    if (selectedCategory) {
      setFilter(prev => ({
        ...prev,
        allInventory: false,
        selectCategory: selectedCategory
      }));
    }
  }, [selectedCategory]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const purchaseCol = collection(db, "purchases");
      const purchaseSnapshot = await getDocs(purchaseCol);
      const purchaseList = [];
      
      purchaseSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const itemsArray = data.items || data.itemDetails || [];
        itemsArray.forEach(item => {
          purchaseList.push({
            itemCode: item.itemCode || item.itemId,
            quantity: parseFloat(item.quantity || 0),
            purchaseDate: data.purchaseDate || data.createdAt || new Date().toISOString(),
          });
        });
      });

      const salesCol = collection(db, "sales");
      const salesSnapshot = await getDocs(salesCol);
      const salesList = [];
      
      salesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const itemsArray = data.items || [];
        itemsArray.forEach(item => {
          salesList.push({
            itemCode: item.itemCode || item.id,
            quantity: parseFloat(item.quantity || 0),
            saleDate: data.saleDate || data.createdAt || new Date().toISOString(),
          });
        });
      });

      setAllPurchases(purchaseList);
      setAllSales(salesList);
    } catch (error) {
      console.error("Error loading transactions:", error);
      alert("Error loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (db && items.length > 0) {
      loadTransactions();
    }
  }, [db, items.length]);

  const loadReportData = () => {
    setLoading(true);
    let itemsToProcess = items;

    if (!filter.allInventory && filter.selectCategory) {
      itemsToProcess = items.filter(item => item.category === filter.selectCategory);
    } else if (!filter.allInventory && !filter.selectCategory) {
      itemsToProcess = [];
    }

    const result = calculateBalances(
      itemsToProcess,
      allPurchases,
      allSales,
      filter.dateFrom,
      filter.dateTo
    );

    setTimeout(() => {
      setReportData(result);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    if (items.length > 0 && allPurchases.length >= 0 && allSales.length >= 0) {
      loadReportData();
    }
  }, [items, allPurchases, allSales, filter]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Inventory Stock Report</h1>
      </div>

      <div style={styles.reportBox}>
        <div style={styles.filterGrid}>
          <div style={styles.filterGroup}>
            <div style={styles.radioContainer} onClick={() => setFilter(prev => ({ ...prev, allInventory: true, selectCategory: "" }))}>
              <input type="radio" name="inventoryFilter" checked={filter.allInventory} onChange={() => {}} style={{ accentColor: currentTheme.PRIMARY }} />
              <span style={{ marginLeft: "8px", color: currentTheme.TEXT_PRIMARY, fontWeight: "600" }}>All Inventory Items</span>
            </div>

            <div style={styles.radioContainer} onClick={() => setFilter(prev => ({ ...prev, allInventory: false }))}>
              <input type="radio" name="inventoryFilter" checked={!filter.allInventory} onChange={() => {}} style={{ accentColor: currentTheme.PRIMARY }} />
              <span style={{ marginLeft: "8px", color: currentTheme.TEXT_PRIMARY, fontWeight: "600" }}>Select Category</span>
            </div>

            <select
              value={filter.selectCategory}
              onChange={(e) => setFilter(prev => ({ ...prev, selectCategory: e.target.value, allInventory: false }))}
              disabled={filter.allInventory}
              style={{ ...styles.input, marginTop: "5px", opacity: filter.allInventory ? 0.5 : 1 }}
            >
              <option value="">-- Select Category --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.categoryName}>{cat.categoryName}</option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={styles.filterLabel}>From</label>
                <input type="date" value={filter.dateFrom} onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))} style={styles.input} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.filterLabel}>To</label>
                <input type="date" value={filter.dateTo} onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))} style={styles.input} />
              </div>
              <button onClick={loadReportData} disabled={loading} style={{ ...styles.button, flex: 0.5, minWidth: '120px' }}>
                {loading ? "Calculating..." : "Display"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.reportBox}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Item Code</th>
                <th style={styles.th}>Item Name</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Opening</th>
                <th style={{ ...styles.th, textAlign: "right" }}>In</th>
                <th style={{ ...styles.th, textAlign: "right", color: currentTheme.PRIMARY }}>Out</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Closing</th>
                <th style={styles.th}>Unit</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Cost</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ ...styles.td, textAlign: "center", padding: "30px" }}>Loading...</td></tr>
              ) : reportData.reportItems.length === 0 ? (
                <tr><td colSpan="9" style={{ ...styles.td, textAlign: "center", padding: "30px" }}>No data found.</td></tr>
              ) : (
                reportData.reportItems.map((item, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{item.itemCode}</td>
                    <td style={styles.td}>{item.itemName}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>{item.openingBalance}</td>
                    <td style={{ ...styles.td, textAlign: "right", color: currentTheme.ACCENT_SUCCESS }}>{item.quantityIn}</td>
                    <td style={{ ...styles.td, textAlign: "right", color: currentTheme.PRIMARY }}>{item.quantityOut}</td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: parseFloat(item.closingBalance) < 0 ? currentTheme.PRIMARY : currentTheme.ACCENT_SUCCESS }}>
                      {item.closingBalance}
                    </td>
                    <td style={styles.td}>{item.unit}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>Rs {item.cost}</td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: "700" }}>Rs {item.value}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.footerBar}>
          <span>Total Inventory Value (Rs)</span>
          <span>Rs {reportData.totalValue}</span>
        </div>
      </div>
    </div>
  );
}

export default InventoryStock;