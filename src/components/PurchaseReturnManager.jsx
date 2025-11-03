import React, { useState, useEffect, useMemo, useRef } from "react";
import { collection, addDoc, getDocs, serverTimestamp, doc, updateDoc, query, where } from "firebase/firestore";
import { format } from 'date-fns';

const PurchaseReturnManager = ({ db, items, loadItems, currentTheme }) => {
    const [purchases, setPurchases] = useState([]);
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("processReturn");
    
    // Form State
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [returnItems, setReturnItems] = useState([]);
    const [returnDate, setReturnDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [returnReason, setReturnReason] = useState('');
    const [returnNotes, setReturnNotes] = useState('');
    
    // Search States
    const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
    
    const invoiceSearchRef = useRef(null);

    // Load Purchases and Returns
    useEffect(() => {
        loadPurchases();
        loadReturns();
    }, [db]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (invoiceSearchRef.current && !invoiceSearchRef.current.contains(event.target)) {
                setShowInvoiceDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadPurchases = async () => {
        setLoading(true);
        try {
            const purchasesCol = collection(db, "purchases");
            const purchaseSnapshot = await getDocs(purchasesCol);
            const purchaseList = purchaseSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    purchaseDate: data.purchaseDate?.toDate ? format(data.purchaseDate.toDate(), 'yyyy-MM-dd') : data.purchaseDate,
                    displayDate: data.purchaseDate?.toDate ? format(data.purchaseDate.toDate(), 'dd MMM yyyy') : 'N/A',
                    itemDetails: data.itemDetails || [],
                    vendorName: data.vendorName || 'Unknown Supplier',
                    vendorInvoiceNo: data.vendorInvoiceNo || data.poNo || 'N/A',
                    vendorPhone: data.vendorPhone || data.vendorContact || '',
                };
            });
            setPurchases(purchaseList);
        } catch (error) {
            console.error("Error loading purchases: ", error);
        } finally {
            setLoading(false);
        }
    };

    const loadReturns = async () => {
        try {
            const returnsCol = collection(db, "purchaseReturns");
            const returnSnapshot = await getDocs(returnsCol);
            const returnList = returnSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    returnDate: data.returnDate?.toDate ? format(data.returnDate.toDate(), 'dd MMM yyyy') : 'N/A',
                };
            });
            setReturns(returnList);
        } catch (error) {
            console.error("Error loading returns: ", error);
        }
    };

    // Filter Purchases
    const filteredPurchases = useMemo(() => {
        let filtered = purchases;
        
        if (invoiceSearchTerm.length > 0) {
            const searchLower = invoiceSearchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                p.vendorInvoiceNo.toLowerCase().includes(searchLower) ||
                p.id.toLowerCase().includes(searchLower)
            );
        }
        
        if (supplierSearchTerm.length > 0) {
            const searchLower = supplierSearchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                p.vendorName.toLowerCase().includes(searchLower) ||
                (p.vendorPhone && p.vendorPhone.toLowerCase().includes(searchLower)) ||
                (p.vendorContact && p.vendorContact.toLowerCase().includes(searchLower))
            );
        }
        
        return filtered.slice(0, 10);
    }, [purchases, invoiceSearchTerm, supplierSearchTerm]);

    const handleSelectPurchase = (purchase) => {
        setSelectedPurchase(purchase);
        setInvoiceSearchTerm(purchase.vendorInvoiceNo);
        setSupplierSearchTerm(purchase.vendorName);
        setShowInvoiceDropdown(false);
        
        const initialReturnItems = purchase.itemDetails.map(item => ({
            ...item,
            returnQuantity: 0,
            maxQuantity: parseInt(item.quantity) || 0,
            isSelected: false,
        }));
        setReturnItems(initialReturnItems);
    };

    const handleReturnQuantityChange = (index, value) => {
        const newReturnItems = [...returnItems];
        const qty = parseInt(value) || 0;
        const maxQty = newReturnItems[index].maxQuantity;
        
        newReturnItems[index].returnQuantity = Math.min(Math.max(0, qty), maxQty);
        newReturnItems[index].isSelected = newReturnItems[index].returnQuantity > 0;
        
        setReturnItems(newReturnItems);
    };

    const reverseInventoryStock = async (returnItemsToProcess) => {
        for (const item of returnItemsToProcess) {
            if (item.returnQuantity > 0 && item.itemId) {
                const itemRef = doc(db, 'items', item.itemId);
                const itemToUpdate = items.find(i => i.id === item.itemId);
                
                if (itemToUpdate) {
                    const currentStock = parseFloat(itemToUpdate.stock || itemToUpdate.quantity || 0);
                    const returnQty = parseInt(item.returnQuantity) || 0;
                    const newStock = Math.max(0, currentStock - returnQty);

                    await updateDoc(itemRef, { 
                        stock: newStock,
                        quantity: newStock,
                        lastUpdated: serverTimestamp()
                    });
                }
            }
        }
        loadItems();
    };

    const handleSubmitReturn = async (e) => {
        e.preventDefault();
        
        if (!selectedPurchase) {
            alert("❌ Please select a purchase invoice first.");
            return;
        }
        
        const itemsToReturn = returnItems.filter(item => item.isSelected && item.returnQuantity > 0);
        
        if (itemsToReturn.length === 0) {
            alert("❌ Please select at least one item with return quantity > 0.");
            return;
        }
        
        if (!returnReason.trim()) {
            alert("❌ Please provide a return reason.");
            return;
        }

        setLoading(true);
        try {
            const totalReturnAmount = itemsToReturn.reduce((sum, item) => {
                return sum + (item.returnQuantity * (parseFloat(item.purchasePrice) || 0));
            }, 0);

            const returnData = {
                purchaseId: selectedPurchase.id,
                purchaseInvoiceNo: selectedPurchase.vendorInvoiceNo,
                vendorName: selectedPurchase.vendorName,
                vendorId: selectedPurchase.vendorId || 'N/A',
                returnDate: new Date(returnDate),
                returnItems: itemsToReturn.map(item => ({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    originalQuantity: item.maxQuantity,
                    returnQuantity: item.returnQuantity,
                    purchasePrice: item.purchasePrice,
                    returnAmount: item.returnQuantity * (parseFloat(item.purchasePrice) || 0),
                })),
                totalReturnAmount: parseFloat(totalReturnAmount.toFixed(2)),
                returnReason: returnReason,
                returnNotes: returnNotes,
                status: 'Completed',
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "purchaseReturns"), returnData);
            await reverseInventoryStock(itemsToReturn);
            
            alert(`✅ Purchase Return processed successfully!\n💰 Return Amount: Rs ${totalReturnAmount.toLocaleString()}\n📦 Inventory updated.`);
            
            setSelectedPurchase(null);
            setReturnItems([]);
            setInvoiceSearchTerm('');
            setSupplierSearchTerm('');
            setReturnReason('');
            setReturnNotes('');
            setReturnDate(format(new Date(), 'yyyy-MM-dd'));
            
            loadReturns();
            setActiveTab('viewReturns');
        } catch (error) {
            console.error("Error processing return: ", error);
            alert("Error processing return: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "30px", background: currentTheme.BODY_BG, minHeight: "100vh", color: currentTheme.TEXT_PRIMARY, fontFamily: "Arial, sans-serif" }}>
            {/* HEADER */}
            <div style={{ marginBottom: "30px" }}>
                <h1 style={{ margin: "0 0 5px 0", fontSize: "32px", fontWeight: "800", color: currentTheme.TEXT_PRIMARY }}>
                    🔙 Purchase Return Management
                </h1>
                <p style={{ margin: 0, color: currentTheme.TEXT_MUTED, fontSize: "15px" }}>
                    Process vendor returns, adjust inventory stock, and manage payments due.
                </p>
            </div>

            {/* TABS */}
            <div style={{ display: "flex", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}`, marginBottom: "30px" }}>
                <button
                    onClick={() => setActiveTab("processReturn")}
                    style={{
                        padding: "10px 20px",
                        background: "none",
                        color: activeTab === "processReturn" ? currentTheme.PRIMARY : currentTheme.TEXT_MUTED,
                        border: "none",
                        borderBottom: activeTab === "processReturn" ? `3px solid ${currentTheme.PRIMARY}` : "none",
                        fontWeight: activeTab === "processReturn" ? "bold" : "normal",
                        cursor: "pointer",
                        fontSize: "16px",
                        marginBottom: "-2px",
                        transition: "color 0.15s",
                    }}
                >
                    ⚡ Process New Return
                </button>
                <button
                    onClick={() => setActiveTab("viewReturns")}
                    style={{
                        padding: "10px 20px",
                        background: "none",
                        color: activeTab === "viewReturns" ? currentTheme.PRIMARY : currentTheme.TEXT_MUTED,
                        border: "none",
                        borderBottom: activeTab === "viewReturns" ? `3px solid ${currentTheme.PRIMARY}` : "none",
                        fontWeight: activeTab === "viewReturns" ? "bold" : "normal",
                        cursor: "pointer",
                        fontSize: "16px",
                        marginBottom: "-2px",
                        transition: "color 0.15s",
                    }}
                >
                    📜 Return History ({returns.length})
                </button>
            </div>

            <div style={{ background: currentTheme.CARD_BG, borderRadius: "12px", padding: "25px", boxShadow: "0 8px 25px rgba(0,0,0,0.1)", border: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                {activeTab === "processReturn" && (
                    <form onSubmit={handleSubmitReturn}>
                        {/* Select Purchase Invoice */}
                        <h3 style={{ color: currentTheme.PRIMARY, fontSize: '18px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🔍 Select Purchase Invoice
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ marginBottom: "15px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: currentTheme.TEXT_MUTED, textTransform: 'uppercase' }}>
                                    Search Invoice No...
                                </label>
                                <div style={{ position: 'relative', width: '100%' }} ref={invoiceSearchRef}>
                                    <input
                                        type="text"
                                        placeholder="Type Invoice Number or ID..."
                                        value={invoiceSearchTerm}
                                        onChange={(e) => {
                                            setInvoiceSearchTerm(e.target.value);
                                            setShowInvoiceDropdown(true);
                                        }}
                                        onFocus={() => setShowInvoiceDropdown(true)}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            background: currentTheme.SIDEBAR_BG,
                                            border: selectedPurchase ? `1px solid ${currentTheme.ACCENT_SUCCESS}` : `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                                            borderRadius: "8px",
                                            color: currentTheme.TEXT_PRIMARY,
                                            fontSize: "15px",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                    {showInvoiceDropdown && filteredPurchases.length > 0 && (
                                        <ul style={{
                                            position: 'absolute',
                                            zIndex: 100,
                                            width: '100%',
                                            maxHeight: '250px',
                                            overflowY: 'auto',
                                            background: currentTheme.CARD_BG,
                                            border: `1px solid ${currentTheme.PRIMARY}`,
                                            borderRadius: '6px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                            marginTop: '2px',
                                            padding: 0,
                                            listStyle: 'none',
                                        }}>
                                            {filteredPurchases.map((purchase) => (
                                                <li
                                                    key={purchase.id}
                                                    style={{
                                                        padding: '10px',
                                                        cursor: 'pointer',
                                                        color: currentTheme.TEXT_PRIMARY,
                                                        fontSize: '14px',
                                                        borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onClick={() => handleSelectPurchase(purchase)}
                                                    onMouseOver={(e) => e.currentTarget.style.background = currentTheme.SIDEBAR_HOVER}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ fontWeight: 'bold' }}>{purchase.vendorInvoiceNo}</div>
                                                    <div style={{ fontSize: '11px', color: currentTheme.TEXT_MUTED }}>
                                                        {purchase.vendorName} • {purchase.displayDate} • {purchase.itemDetails.length} items
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: currentTheme.TEXT_MUTED, textTransform: 'uppercase' }}>
                                    Search Supplier...
                                </label>
                                <input
                                    type="text"
                                    placeholder="Type Supplier Name or Phone Number..."
                                    value={supplierSearchTerm}
                                    onChange={(e) => setSupplierSearchTerm(e.target.value)}
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
                        </div>

                        {/* Selected Purchase Info */}
                        {selectedPurchase ? (
                            <div style={{
                                background: currentTheme.SIDEBAR_BG,
                                padding: '15px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                border: `1px solid ${currentTheme.ACCENT_SUCCESS}`,
                                borderLeft: `5px solid ${currentTheme.ACCENT_SUCCESS}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0', color: currentTheme.TEXT_PRIMARY, fontSize: '18px' }}>
                                            📋 {selectedPurchase.vendorInvoiceNo}
                                        </h4>
                                        <p style={{ margin: '0', fontSize: '13px', color: currentTheme.TEXT_MUTED }}>
                                            👤 {selectedPurchase.vendorName} • 📅 {selectedPurchase.displayDate} • 
                                            📦 {selectedPurchase.itemDetails.length} Items
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPurchase(null);
                                            setReturnItems([]);
                                            setInvoiceSearchTerm('');
                                            setSupplierSearchTerm('');
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            background: currentTheme.PRIMARY,
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        ✕ Clear
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '80px 20px', color: currentTheme.TEXT_MUTED }}>
                                <div style={{ fontSize: '48px', marginBottom: '15px' }}>👆</div>
                                <h3 style={{ margin: '0 0 8px 0', color: currentTheme.TEXT_PRIMARY }}>
                                    Select a Purchase Invoice
                                </h3>
                                <p style={{ margin: 0, fontSize: '14px' }}>
                                    Choose an invoice from the search above to process return
                                </p>
                            </div>
                        )}

                        {/* Return Items Table */}
                        {selectedPurchase && returnItems.length > 0 && (
                            <>
                                <h3 style={{ color: currentTheme.PRIMARY, fontSize: '18px', marginBottom: '10px', marginTop: '25px' }}>
                                    📦 Select Items to Return
                                </h3>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: "10px" }}>
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                        <thead>
                                            <tr style={{ background: currentTheme.SIDEBAR_BG }}>
                                                <th style={{ padding: "15px", textAlign: "center", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}`, width: '5%' }}>✓</th>
                                                <th style={{ padding: "15px", textAlign: "left", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}`, width: '40%' }}>Item Name</th>
                                                <th style={{ padding: "15px", textAlign: "center", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}`, width: '15%' }}>Purchased Qty</th>
                                                <th style={{ padding: "15px", textAlign: "center", color: currentTheme.PRIMARY, fontSize: "13px", textTransform: "uppercase", fontWeight: "700", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}`, width: '15%' }}>🔙 Return Qty</th>
                                                <th style={{ padding: "15px", textAlign: "right", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}`, width: '15%' }}>Unit Price (Rs)</th>
                                                <th style={{ padding: "15px", textAlign: "right", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}`, width: '10%' }}>Return Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {returnItems.map((item, index) => (
                                                <tr key={index} style={{ 
                                                    background: item.isSelected ? `${currentTheme.ACCENT_SUCCESS}15` : (index % 2 === 0 ? currentTheme.CARD_BG : currentTheme.SIDEBAR_BG)
                                                }}>
                                                    <td style={{ padding: "15px", textAlign: 'center', borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={item.isSelected}
                                                            readOnly
                                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: "15px", borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                        <strong>{item.itemName}</strong>
                                                    </td>
                                                    <td style={{ padding: "15px", textAlign: 'center', color: currentTheme.TEXT_MUTED, borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                        {item.maxQuantity}
                                                    </td>
                                                    <td style={{ padding: "15px", textAlign: 'center', borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.maxQuantity}
                                                            value={item.returnQuantity}
                                                            onChange={(e) => handleReturnQuantityChange(index, e.target.value)}
                                                            style={{
                                                                width: '80px',
                                                                padding: '8px',
                                                                textAlign: 'center',
                                                                background: currentTheme.BODY_BG,
                                                                border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                                                                borderRadius: '6px',
                                                                color: currentTheme.TEXT_PRIMARY,
                                                                fontSize: "15px",
                                                                fontWeight: "600"
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: "15px", textAlign: 'right', fontWeight: '600', borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                        Rs {(parseFloat(item.purchasePrice) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td style={{ padding: "15px", textAlign: 'right', fontWeight: 'bold', fontSize: "17px", color: item.returnQuantity > 0 ? currentTheme.PRIMARY : currentTheme.TEXT_PRIMARY, borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                        Rs {(item.returnQuantity * (parseFloat(item.purchasePrice) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Return Details */}
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '25px' }}>
                                    <div>
                                        <h3 style={{ color: currentTheme.PRIMARY, fontSize: '18px', marginBottom: '15px' }}>
                                            📝 Return Details
                                        </h3>
                                        <div style={{ marginBottom: "15px" }}>
                                            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: currentTheme.TEXT_MUTED, textTransform: 'uppercase' }}>
                                                Return Date *
                                            </label>
                                            <input
                                                type="date"
                                                value={returnDate}
                                                onChange={(e) => setReturnDate(e.target.value)}
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
                                                required
                                            />
                                        </div>
                                        <div style={{ marginBottom: "15px" }}>
                                            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: currentTheme.TEXT_MUTED, textTransform: 'uppercase' }}>
                                                Return Reason *
                                            </label>
                                            <select
                                                value={returnReason}
                                                onChange={(e) => setReturnReason(e.target.value)}
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
                                                required
                                            >
                                                <option value="">Select Reason...</option>
                                                <option value="Defective">Defective Items</option>
                                                <option value="Wrong Items">Wrong Items Received</option>
                                                <option value="Damaged">Damaged in Transit</option>
                                                <option value="Quality Issues">Quality Issues</option>
                                                <option value="Excess Stock">Excess Stock</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: "15px" }}>
                                            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: currentTheme.TEXT_MUTED, textTransform: 'uppercase' }}>
                                                Additional Notes
                                            </label>
                                            <textarea
                                                value={returnNotes}
                                                onChange={(e) => setReturnNotes(e.target.value)}
                                                placeholder="Add any additional notes..."
                                                rows="3"
                                                style={{
                                                    width: "100%",
                                                    padding: "12px",
                                                    background: currentTheme.SIDEBAR_BG,
                                                    border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                                                    borderRadius: "8px",
                                                    color: currentTheme.TEXT_PRIMARY,
                                                    fontSize: "15px",
                                                    boxSizing: "border-box",
                                                    resize: 'vertical',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div style={{
                                        background: currentTheme.SIDEBAR_BG,
                                        padding: '20px',
                                        borderRadius: '10px',
                                        border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                                        height: 'fit-content'
                                    }}>
                                        <h4 style={{ color: currentTheme.TEXT_MUTED, margin: '0 0 15px 0', borderBottom: `1px solid ${currentTheme.TEXT_MUTED}`, paddingBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                                            RETURN SUMMARY
                                        </h4>
                                        <p style={{ color: currentTheme.TEXT_PRIMARY, display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                            Items Selected: 
                                            <span style={{ fontWeight: 'bold' }}>
                                                {returnItems.filter(i => i.isSelected).length}
                                            </span>
                                        </p>
                                        <p style={{ color: currentTheme.TEXT_PRIMARY, display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                            Total Return Qty: 
                                            <span style={{ fontWeight: 'bold' }}>
                                                {returnItems.reduce((sum, i) => sum + i.returnQuantity, 0)}
                                            </span>
                                        </p>
                                        <hr style={{ border: 'none', borderTop: `1px dashed ${currentTheme.TEXT_MUTED}`, margin: '12px 0' }} />
                                        <h3 style={{ 
                                            color: currentTheme.PRIMARY, 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            margin: '15px 0 0 0',
                                            fontSize: '18px',
                                            fontWeight: '800'
                                        }}>
                                            RETURN AMOUNT:
                                            <span>
                                                Rs {returnItems.reduce((sum, i) => sum + (i.returnQuantity * (parseFloat(i.purchasePrice) || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </h3>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading || returnItems.filter(i => i.isSelected).length === 0}
                                    style={{
                                        marginTop: '25px',
                                        padding: '18px 45px',
                                        background: loading || returnItems.filter(i => i.isSelected).length === 0 ? currentTheme.TEXT_MUTED : currentTheme.ACCENT_SUCCESS,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: loading || returnItems.filter(i => i.isSelected).length === 0 ? 'not-allowed' : 'pointer',
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        width: '100%',
                                        transition: "background 0.2s",
                                        boxShadow: loading || returnItems.filter(i => i.isSelected).length === 0 ? "none" : `0 4px 10px rgba(16, 185, 129, 0.4)`
                                    }}
                                >
                                    {loading ? '⏳ Processing...' : '🔙 Process Return & Adjust Stock'}
                                </button>
                            </>
                        )}
                    </form>
                )}

                {/* Return History Tab */}
                {activeTab === "viewReturns" && (
                    <div>
                        {loading && returns.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: currentTheme.TEXT_MUTED }}>
                                <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                                🔄 Loading return history...
                            </div>
                        ) : returns.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '80px 20px', color: currentTheme.TEXT_MUTED }}>
                                <div style={{ fontSize: '64px', marginBottom: '15px' }}>📭</div>
                                <h3 style={{ margin: '0 0 8px 0', color: currentTheme.TEXT_PRIMARY }}>
                                    No Return Records Found
                                </h3>
                                <p style={{ margin: 0, fontSize: '14px' }}>
                                    Process your first purchase return to see history here
                                </p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto', border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: "10px" }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                    <thead>
                                        <tr style={{ background: currentTheme.SIDEBAR_BG }}>
                                            <th style={{ padding: "15px", textAlign: "left", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>Return Date</th>
                                            <th style={{ padding: "15px", textAlign: "left", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>Purchase Invoice</th>
                                            <th style={{ padding: "15px", textAlign: "left", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>Supplier</th>
                                            <th style={{ padding: "15px", textAlign: "center", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>Items Returned</th>
                                            <th style={{ padding: "15px", textAlign: "right", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>Return Amount</th>
                                            <th style={{ padding: "15px", textAlign: "left", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>Reason</th>
                                            <th style={{ padding: "15px", textAlign: "left", color: currentTheme.TEXT_MUTED, fontSize: "13px", textTransform: "uppercase", fontWeight: "600", borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}` }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returns
                                            .sort((a, b) => {
                                                const dateA = a.returnDate ? new Date(a.returnDate) : new Date(0);
                                                const dateB = b.returnDate ? new Date(b.returnDate) : new Date(0);
                                                return dateB - dateA;
                                            })
                                            .map((returnRecord, index) => (
                                            <tr key={returnRecord.id} style={{
                                                background: index % 2 === 0 ? currentTheme.CARD_BG : currentTheme.SIDEBAR_BG
                                            }}>
                                                <td style={{ padding: "15px", borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                    {returnRecord.returnDate}
                                                </td>
                                                <td style={{ padding: "15px", fontWeight: "700", color: currentTheme.PRIMARY, borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                    #{returnRecord.purchaseInvoiceNo}
                                                </td>
                                                <td style={{ padding: "15px", color: currentTheme.TEXT_MUTED, borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                    {returnRecord.vendorName}
                                                </td>
                                                <td style={{ padding: "15px", textAlign: 'center', borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                    <details style={{ cursor: 'pointer' }}>
                                                        <summary style={{ 
                                                            color: currentTheme.ACCENT_INFO, 
                                                            fontWeight: 'bold',
                                                            listStyle: 'none',
                                                            display: 'inline-block'
                                                        }}>
                                                            {returnRecord.returnItems?.length || 0} items ▼
                                                        </summary>
                                                        <div style={{ 
                                                            marginTop: '8px', 
                                                            padding: '10px', 
                                                            background: currentTheme.SIDEBAR_BG,
                                                            borderRadius: '4px',
                                                            textAlign: 'left'
                                                        }}>
                                                            {returnRecord.returnItems?.map((item, idx) => (
                                                                <div key={idx} style={{ 
                                                                    fontSize: '12px', 
                                                                    marginBottom: '5px',
                                                                    color: currentTheme.TEXT_PRIMARY
                                                                }}>
                                                                    • {item.itemName} - Qty: <strong>{item.returnQuantity}</strong>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </details>
                                                </td>
                                                <td style={{ padding: "15px", textAlign: 'right', fontWeight: 'bold', fontSize: "18px", color: currentTheme.PRIMARY, borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                    Rs {(returnRecord.totalReturnAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: "15px", borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        background: `${currentTheme.WARNING}20`,
                                                        color: currentTheme.WARNING,
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: '600'
                                                    }}>
                                                        {returnRecord.returnReason}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "15px", borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        background: `${currentTheme.ACCENT_SUCCESS}20`,
                                                        color: currentTheme.ACCENT_SUCCESS,
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: '600'
                                                    }}>
                                                        ✓ {returnRecord.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseReturnManager;