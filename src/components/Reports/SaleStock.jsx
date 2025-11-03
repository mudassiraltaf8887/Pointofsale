import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';

// ❌ THEME object DELETE ho gaya

// ✅ currentTheme prop add kiya - Functional component
function SaleStock({ db, currentTheme }) {
  const [salesData, setSalesData] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [customerType, setCustomerType] = useState('all');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [dateFrom, setDateFrom] = useState(getTodayDate());
  const [dateTo, setDateTo] = useState(getTodayDate());
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalGST, setTotalGST] = useState(0);
  const [totalWithGST, setTotalWithGST] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  const loadSalesData = async () => {
    try {
      setLoading(true);

      if (!db) {
        console.error('Firebase db not provided');
        return;
      }

      const salesCol = collection(db, 'sales');
      const salesSnapshot = await getDocs(salesCol);

      const salesList = salesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          invoiceNo: data.recid || doc.id,
          date: data.saleDate || data.createdAt,
          customerName: data.customerName || 'Walk-in',
          customerType: data.customerType || 'Cash',
          paymentMethod: data.paymentMethod || 'Cash',
          items: data.items || [],
          subtotal: data.subtotal || 0,
          tax: data.tax || 0,
          taxRate: data.taxRate || 0,
          discount: data.discount || 0,
          total: data.total || 0,
          status: data.status || 'completed',
          counter: data.counter || 'counter1',
          cardPaymentDetails: data.cardPaymentDetails || null,
        };
      });

      setSalesData(salesList);
      setFilteredSales(salesList);
    } catch (error) {
      console.error('Error loading sales:', error);
      alert('Error loading sales data!');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...salesData];

    if (selectedFilter !== 'all') {
      if (selectedFilter === 'return') {
        filtered = filtered.filter(sale => sale.status === 'returned');
      } else {
        filtered = filtered.filter(sale => sale.counter === selectedFilter);
      }
    }

    if (customerType !== 'all') {
      filtered = filtered.filter(sale => {
        const saleCustomerType = sale.customerType?.toLowerCase().trim();
        const filterType = customerType.toLowerCase().trim();
        return saleCustomerType === filterType;
      });
    }

    if (searchCustomer.trim()) {
      filtered = filtered.filter(sale =>
        sale.customerName?.toLowerCase().includes(searchCustomer.toLowerCase())
      );
    }

    if (dateFrom && dateTo) {
      filtered = filtered.filter(sale => {
        if (!sale.date) return false;

        const saleDate = sale.date.toDate ? sale.date.toDate() : new Date(sale.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);

        return saleDate >= fromDate && saleDate <= toDate;
      });
    }

    const calculatedTotalAmount = filtered.reduce((sum, sale) => sum + (sale.subtotal || 0), 0);
    const calculatedTotalGST = filtered.reduce((sum, sale) => sum + (sale.tax || 0), 0);
    const calculatedTotalWithGST = filtered.reduce((sum, sale) => sum + (sale.total || 0), 0);

    setFilteredSales(filtered);
    setTotalAmount(calculatedTotalAmount);
    setTotalGST(calculatedTotalGST);
    setTotalWithGST(calculatedTotalWithGST);
    setTotalSales(filtered.length);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB');
  };

  const handleDisplay = () => {
    loadSalesData();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExcel = () => {
    let csvContent = "Invoice No,Date,Customer,Customer Type,Item Code,Item Name,Quantity,Unit,Rate,Amount Exc Tax,GST,Amount Inc Tax\n";

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const itemGST = (item.amount * (sale.taxRate / 100)).toFixed(2);
        const itemTotal = (parseFloat(item.amount) + parseFloat(itemGST)).toFixed(2);

        csvContent += `${sale.invoiceNo},${formatDate(sale.date)},${sale.customerName},${sale.customerType},${item.itemCode || 'N/A'},${item.name},${item.quantity},Pcs,${item.price.toFixed(2)},${item.amount.toFixed(2)},${itemGST},${itemTotal}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_register_${new Date().getTime()}.csv`;
    link.click();
  };

  useEffect(() => {
    loadSalesData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [salesData, selectedFilter, customerType, searchCustomer, dateFrom, dateTo]);

  // Styles using currentTheme
  const statCardStyle = {
    background: currentTheme.SIDEBAR_BG,
    padding: '15px 20px',
    borderRadius: '10px',
    border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
    transition: 'all 0.3s'
  };

  const actionButtonStyle = {
    padding: '12px 24px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
  };

  const modernLabelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    color: currentTheme.TEXT_PRIMARY,
    fontWeight: '600'
  };

  const modernInputStyle = {
    width: '100%',
    padding: '12px 15px',
    background: currentTheme.SIDEBAR_BG,
    border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
    borderRadius: '8px',
    color: currentTheme.TEXT_PRIMARY,
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'all 0.3s',
    outline: 'none'
  };

  const modernThStyle = {
    padding: '15px 12px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: currentTheme.PRIMARY,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: currentTheme.SIDEBAR_BG,
  };

  const modernTdStyle = {
    padding: '12px',
    color: currentTheme.TEXT_PRIMARY,
    fontSize: '13px'
  };

  return (
    <div style={{
      background: currentTheme.BODY_BG,
      minHeight: '100vh',
      padding: '25px',
      color: currentTheme.TEXT_PRIMARY,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Header with Stats */}
      <div style={{
        background: currentTheme.CARD_BG,
        padding: '25px 30px',
        borderRadius: '12px',
        marginBottom: '25px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: `1px solid ${currentTheme.SIDEBAR_HOVER}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{
              margin: '0 0 5px 0',
              fontSize: '28px',
              color: currentTheme.PRIMARY,
              textShadow: '0 2px 10px rgba(59,130,246,0.3)'
            }}>
              📊 Sale Register
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: currentTheme.TEXT_MUTED }}>
              View and analyze your sales data
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleDisplay} style={{ ...actionButtonStyle, background: currentTheme.ACCENT_INFO || currentTheme.PRIMARY }}>
              🔄 Refresh
            </button>
            <button onClick={handlePrint} style={{ ...actionButtonStyle, background: currentTheme.ACCENT_WARNING }}>
              🖨️ Print
            </button>
            <button onClick={handleExcel} style={{ ...actionButtonStyle, background: currentTheme.ACCENT_SUCCESS }}>
              📊 Excel
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: '12px', color: currentTheme.TEXT_MUTED, marginBottom: '5px' }}>Total Sales</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentTheme.ACCENT_INFO || currentTheme.PRIMARY }}>{totalSales}</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '12px', color: currentTheme.TEXT_MUTED, marginBottom: '5px' }}>Subtotal</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: currentTheme.ACCENT_WARNING }}>Rs. {totalAmount.toFixed(2)}</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '12px', color: currentTheme.TEXT_MUTED, marginBottom: '5px' }}>Total GST</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: currentTheme.ACCENT_SUCCESS }}>Rs. {totalGST.toFixed(2)}</div>
          </div>
          <div style={{ ...statCardStyle, background: `linear-gradient(135deg, ${currentTheme.PRIMARY} 0%, ${currentTheme.SECONDARY || currentTheme.PRIMARY} 100%)` }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', marginBottom: '5px' }}>Grand Total</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'white' }}>Rs. {totalWithGST.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={{
        background: currentTheme.CARD_BG,
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '25px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        border: `1px solid ${currentTheme.SIDEBAR_HOVER}`
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          color: currentTheme.PRIMARY,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🔍</span> Filters
        </h3>

        {/* Radio Buttons */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { value: 'all', label: '📋 All Sales', color: currentTheme.PRIMARY },
            { value: 'return', label: '↩️ Sales Return', color: currentTheme.PRIMARY }
          ].map(option => (
            <label key={option.value} style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '12px 20px',
              background: selectedFilter === option.value ? option.color : currentTheme.SIDEBAR_BG,
              borderRadius: '8px',
              transition: 'all 0.3s',
              border: selectedFilter === option.value ? `2px solid ${option.color}` : `1px solid ${currentTheme.SIDEBAR_HOVER}`,
              boxShadow: selectedFilter === option.value ? `0 4px 15px ${option.color}40` : 'none'
            }}>
              <input
                type="radio"
                name="salesFilter"
                value={option.value}
                checked={selectedFilter === option.value}
                onChange={(e) => setSelectedFilter(e.target.value)}
                style={{ marginRight: '10px', cursor: 'pointer' }}
              />
              <span style={{
                fontWeight: selectedFilter === option.value ? 'bold' : 'normal',
                color: selectedFilter === option.value ? 'white' : currentTheme.TEXT_PRIMARY
              }}>
                {option.label}
              </span>
            </label>
          ))}
        </div>

        {/* Dropdown Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={modernLabelStyle}>💳 Customer Type</label>
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              style={modernInputStyle}
            >
              <option value="all">All Types</option>
              <option value="Cash">Cash</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          <div>
            <label style={modernLabelStyle}>👤 Customer Name</label>
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              style={modernInputStyle}
            />
          </div>
        </div>

        {/* Date Range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={modernLabelStyle}>📅 From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={modernInputStyle}
            />
          </div>
          <span style={{ paddingBottom: '10px', fontWeight: 'bold', color: currentTheme.PRIMARY }}>→</span>
          <div>
            <label style={modernLabelStyle}>📅 To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={modernInputStyle}
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div style={{
        background: currentTheme.CARD_BG,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        border: `1px solid ${currentTheme.SIDEBAR_HOVER}`
      }}>
        {loading ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: currentTheme.TEXT_MUTED,
            fontSize: '16px'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>⏳</div>
            Loading sales data...
          </div>
        ) : filteredSales.length === 0 ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: currentTheme.TEXT_MUTED,
            fontSize: '16px'
          }}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>📭</div>
            No sales found matching your filters.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                <thead style={{
                  background: currentTheme.SIDEBAR_BG,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  <tr>
                    <th style={modernThStyle}>Invoice</th>
                    <th style={modernThStyle}>Date</th>
                    <th style={modernThStyle}>Customer</th>
                    <th style={modernThStyle}>Type</th>
                    <th style={modernThStyle}>Item Code</th>
                    <th style={modernThStyle}>Item Name</th>
                    <th style={modernThStyle}>Qty</th>
                    <th style={modernThStyle}>Unit</th>
                    <th style={modernThStyle}>Rate</th>
                    <th style={modernThStyle}>Amt (Ex Tax)</th>
                    <th style={modernThStyle}>GST</th>
                    <th style={modernThStyle}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale, saleIdx) =>
                    sale.items.map((item, itemIdx) => {
                      const itemGST = item.amount * (sale.taxRate / 100);
                      const itemTotal = item.amount + itemGST;
                      const isEvenRow = (saleIdx + itemIdx) % 2 === 0;

                      return (
                        <tr
                          key={`${sale.id}-${itemIdx}`}
                          style={{
                            background: isEvenRow ? currentTheme.SIDEBAR_BG : 'transparent',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = currentTheme.SIDEBAR_HOVER}
                          onMouseLeave={(e) => e.currentTarget.style.background = isEvenRow ? currentTheme.SIDEBAR_BG : 'transparent'}
                        >
                          <td style={modernTdStyle}>
                            <span style={{
                              background: currentTheme.PRIMARY + '30',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              color: currentTheme.PRIMARY
                            }}>
                              #{sale.invoiceNo.slice(-6)}
                            </span>
                          </td>
                          <td style={modernTdStyle}>{formatDate(sale.date)}</td>
                          <td style={modernTdStyle}>{sale.customerName}</td>
                          <td style={modernTdStyle}>
                            <span style={{
                              background: sale.customerType === 'Cash' ? currentTheme.ACCENT_SUCCESS + '30' : currentTheme.ACCENT_WARNING + '30',
                              color: sale.customerType === 'Cash' ? currentTheme.ACCENT_SUCCESS : currentTheme.ACCENT_WARNING,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}>
                              {sale.customerType}
                            </span>
                          </td>
                          <td style={modernTdStyle}>{item.itemCode || 'N/A'}</td>
                          <td style={modernTdStyle}>{item.name}</td>
                          <td style={modernTdStyle}>{item.quantity.toFixed(2)}</td>
                          <td style={modernTdStyle}>Pcs</td>
                          <td style={modernTdStyle}>Rs. {item.price.toFixed(2)}</td>
                          <td style={modernTdStyle}>Rs. {item.amount.toFixed(2)}</td>
                          <td style={{ ...modernTdStyle, color: currentTheme.ACCENT_SUCCESS }}>Rs. {itemGST.toFixed(2)}</td>
                          <td style={{ ...modernTdStyle, fontWeight: 'bold', color: currentTheme.PRIMARY }}>
                            Rs. {itemTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SaleStock;