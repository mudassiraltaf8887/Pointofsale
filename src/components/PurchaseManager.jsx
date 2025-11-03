import React, { useState, useEffect, useMemo, useRef } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { format } from 'date-fns';

const PurchaseManager = ({ db, items, loadItems, currentTheme }) => {
    const [purchases, setPurchases] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("addPurchase");
    const [isEditing, setIsEditing] = useState(false);
    const [currentPurchaseId, setCurrentPurchaseId] = useState(null);

    // Search States
    const [vendorSearchTerm, setVendorSearchTerm] = useState('');
    const [showVendorDropdown, setShowVendorDropdown] = useState(false);
    const [vendorActiveSuggestionIndex, setVendorActiveSuggestionIndex] = useState(0);
    
    const [itemSearchTerms, setItemSearchTerms] = useState([]);
    const [activeItemSearchIndex, setActiveItemSearchIndex] = useState(null);
    const [itemActiveSuggestionIndex, setItemActiveSuggestionIndex] = useState([]);

    const vendorSearchRef = useRef(null);
    const itemSearchRefs = useRef([]);
    const itemTableScrollRef = useRef(null);

    const initialFormState = {
        vendorDocId: "",
        vendorName: "",
        vendorInvoiceNo: "",
        poDate: format(new Date(), 'yyyy-MM-dd'),
        purchaseDate: format(new Date(), 'yyyy-MM-dd'),
        itemDetails: [{ itemId: "", itemName: "", quantity: "", purchasePrice: "", subtotal: 0 }],
        subtotalAmount: 0,
        additionalDiscount: 0,
        carriageAndFreight: 0,
        netTotal: 0,
        amountPaid: 0,
        balance: 0,
    };

    const [form, setForm] = useState(initialFormState);

    useEffect(() => {
        loadPurchases();
        loadVendors();
    }, [db]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (vendorSearchRef.current && !vendorSearchRef.current.contains(event.target)) {
                setShowVendorDropdown(false);
            }
            if (itemSearchRefs.current.every(ref => ref && !ref.contains(event.target))) {
                setActiveItemSearchIndex(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const subtotal = form.itemDetails.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
        const netTotal = subtotal - parseFloat(form.additionalDiscount || 0) + parseFloat(form.carriageAndFreight || 0);
        const balance = netTotal - parseFloat(form.amountPaid || 0);
        setForm(prev => ({ ...prev, subtotalAmount: subtotal, netTotal, balance }));
    }, [form.itemDetails, form.additionalDiscount, form.carriageAndFreight, form.amountPaid]);

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
                    poDate: data.poDate?.toDate ? format(data.poDate.toDate(), 'yyyy-MM-dd') : data.poDate,
                };
            });
            setPurchases(purchaseList);
        } catch (error) {
            console.error("Error loading purchases: ", error);
        } finally {
            setLoading(false);
        }
    };

    const loadVendors = async () => {
        try {
            const vendorsCol = collection(db, "vendors");
            const vendorSnapshot = await getDocs(vendorsCol);
            const vendorList = vendorSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setVendors(vendorList);
        } catch (error) {
            console.error("Error loading vendors: ", error);
        }
    };

    const filteredVendors = useMemo(() => {
        if (vendorSearchTerm.length === 0) return vendors.slice(0, 10);
        const searchLower = vendorSearchTerm.toLowerCase();
        return vendors.filter(v => 
            v.vendorName.toLowerCase().includes(searchLower) ||
            v.vendorId.toLowerCase().includes(searchLower)
        ).slice(0, 10);
    }, [vendorSearchTerm, vendors]);

    const handleVendorSelect = (vendor) => {
        setForm(prev => ({ ...prev, vendorDocId: vendor.id, vendorName: vendor.vendorName }));
        setVendorSearchTerm(vendor.vendorName);
        setShowVendorDropdown(false);
    };

    const handleVendorKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setVendorActiveSuggestionIndex(prev => Math.min(prev + 1, filteredVendors.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setVendorActiveSuggestionIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && showVendorDropdown && filteredVendors.length > 0) {
            e.preventDefault();
            handleVendorSelect(filteredVendors[vendorActiveSuggestionIndex]);
        } else if (e.key === 'Escape') {
            setShowVendorDropdown(false);
        }
    };

    const getItemCurrentStock = (itemId) => {
        const item = items.find(i => i.id === itemId);
        return item ? (item.stock || item.quantity || 0) : 0;
    };

    const getFilteredItems = (index) => {
        const searchTerm = itemSearchTerms[index] || '';
        if (searchTerm.length === 0) return items.slice(0, 10);
        const searchLower = searchTerm.toLowerCase();
        return items.filter(item => 
            item.itemName.toLowerCase().includes(searchLower) ||
            (item.barcode && item.barcode.toLowerCase().includes(searchLower))
        ).slice(0, 10);
    };

    const handleItemSearchChange = (e, index) => {
        const value = e.target.value;
        setItemSearchTerms(prev => {
            const newTerms = [...prev];
            newTerms[index] = value;
            return newTerms;
        });
        setActiveItemSearchIndex(index);
        
        const newItemDetails = [...form.itemDetails];
        newItemDetails[index] = {
            ...newItemDetails[index],
            itemId: "",
            itemName: "",
            quantity: newItemDetails[index].quantity,
            purchasePrice: newItemDetails[index].purchasePrice,
            subtotal: 0,
        };
        setForm(prev => ({ ...prev, itemDetails: newItemDetails }));
    };

    const handleItemSelect = (item, index) => {
        setItemSearchTerms(prev => {
            const newTerms = [...prev];
            newTerms[index] = item.itemName;
            return newTerms;
        });
        setActiveItemSearchIndex(null);
        
        const newItemDetails = [...form.itemDetails];
        newItemDetails[index] = {
            ...newItemDetails[index],
            itemId: item.id,
            itemName: item.itemName,
        };
        setForm(prev => ({ ...prev, itemDetails: newItemDetails }));

        setTimeout(() => {
            const quantityInput = document.getElementById(`quantity-${index}`);
            if (quantityInput) quantityInput.focus();
        }, 100);
    };

    const handleItemKeyDown = (e, index) => {
        const filtered = getFilteredItems(index);
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setItemActiveSuggestionIndex(prev => {
                const newIndices = [...prev];
                newIndices[index] = Math.min((newIndices[index] || 0) + 1, filtered.length - 1);
                return newIndices;
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setItemActiveSuggestionIndex(prev => {
                const newIndices = [...prev];
                newIndices[index] = Math.max((newIndices[index] || 0) - 1, 0);
                return newIndices;
            });
        } else if (e.key === 'Enter' && activeItemSearchIndex === index && filtered.length > 0) {
            e.preventDefault();
            handleItemSelect(filtered[itemActiveSuggestionIndex[index] || 0], index);
        } else if (e.key === 'Escape') {
            setActiveItemSearchIndex(null);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleItemDetailChange = (index, field, value) => {
        const newItemDetails = [...form.itemDetails];
        newItemDetails[index][field] = value;
        
        if (field === 'quantity' || field === 'purchasePrice') {
            const qty = parseFloat(newItemDetails[index].quantity) || 0;
            const price = parseFloat(newItemDetails[index].purchasePrice) || 0;
            newItemDetails[index].subtotal = qty * price;
        }
        
        setForm((prev) => ({ ...prev, itemDetails: newItemDetails }));
    };

    const addItemRow = () => {
        setForm((prev) => ({
            ...prev,
            itemDetails: [...prev.itemDetails, { itemId: "", itemName: "", quantity: "", purchasePrice: "", subtotal: 0 }],
        }));
        setItemSearchTerms(prev => [...prev, '']);
        
        setTimeout(() => {
            if (itemTableScrollRef.current) {
                itemTableScrollRef.current.scrollTop = itemTableScrollRef.current.scrollHeight;
            }
        }, 100);
    };

    const removeItemRow = (index) => {
        if (form.itemDetails.length === 1) {
            alert("At least one item is required.");
            return;
        }
        const newItemDetails = form.itemDetails.filter((_, i) => i !== index);
        setForm((prev) => ({ ...prev, itemDetails: newItemDetails }));
        
        setItemSearchTerms(prev => prev.filter((_, i) => i !== index));
    };

    const updateInventoryStock = async (itemDetailsToProcess) => {
        for (const item of itemDetailsToProcess) {
            if (item.itemId && item.quantity) {
                const itemRef = doc(db, 'items', item.itemId);
                const itemToUpdate = items.find(i => i.id === item.itemId);
                
                if (itemToUpdate) {
                    const currentStock = parseFloat(itemToUpdate.stock || itemToUpdate.quantity || 0);
                    const addQty = parseFloat(item.quantity) || 0;
                    const newStock = currentStock + addQty;

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

    const reverseInventoryStock = async (itemDetailsToReverse) => {
        for (const item of itemDetailsToReverse) {
            if (item.itemId && item.quantity) {
                const itemRef = doc(db, 'items', item.itemId);
                const itemToUpdate = items.find(i => i.id === item.itemId);
                
                if (itemToUpdate) {
                    const currentStock = parseFloat(itemToUpdate.stock || itemToUpdate.quantity || 0);
                    const removeQty = parseFloat(item.quantity) || 0;
                    const newStock = Math.max(0, currentStock - removeQty);

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

    const handleSaveNewPurchase = async (e) => {
        e.preventDefault();
        
        if (!form.vendorDocId) {
            alert("Please select a vendor.");
            return;
        }
        
        const validItems = form.itemDetails.filter(item => item.itemId && item.quantity && item.purchasePrice);
        if (validItems.length === 0) {
            alert("Please add at least one valid item with quantity and price.");
            return;
        }

        setLoading(true);
        try {
            const purchaseData = {
                ...form,
                purchaseDate: new Date(form.purchaseDate),
                poDate: form.poDate ? new Date(form.poDate) : null,
                itemDetails: validItems,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "purchases"), purchaseData);
            await updateInventoryStock(validItems);
            
            alert("✅ Purchase Order Saved & Inventory Updated!");
            setForm(initialFormState);
            setVendorSearchTerm('');
            setItemSearchTerms([]);
            loadPurchases();
            setActiveTab('viewPurchases');
        } catch (error) {
            console.error("Error saving purchase: ", error);
            alert("Error saving purchase: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (purchase) => {
        setIsEditing(true);
        setCurrentPurchaseId(purchase.id);
        
        setForm({
            vendorDocId: purchase.vendorDocId || "",
            vendorName: purchase.vendorName || "",
            vendorInvoiceNo: purchase.vendorInvoiceNo || "",
            poDate: purchase.poDate || format(new Date(), 'yyyy-MM-dd'),
            purchaseDate: purchase.purchaseDate || format(new Date(), 'yyyy-MM-dd'),
            itemDetails: purchase.itemDetails || [],
            subtotalAmount: purchase.subtotalAmount || 0,
            additionalDiscount: purchase.additionalDiscount || 0,
            carriageAndFreight: purchase.carriageAndFreight || 0,
            netTotal: purchase.netTotal || 0,
            amountPaid: purchase.amountPaid || 0,
            balance: purchase.balance || 0,
        });
        
        setVendorSearchTerm(purchase.vendorName || '');
        setItemSearchTerms(purchase.itemDetails?.map(item => item.itemName) || []);
        setActiveTab('addPurchase');
    };

    const handleUpdatePurchase = async (e) => {
        e.preventDefault();
        
        if (!currentPurchaseId) {
            alert("No purchase selected for editing.");
            return;
        }

        setLoading(true);
        try {
            const purchaseRef = doc(db, "purchases", currentPurchaseId);
            const oldPurchase = purchases.find(p => p.id === currentPurchaseId);
            
            if (oldPurchase && oldPurchase.itemDetails) {
                await reverseInventoryStock(oldPurchase.itemDetails);
            }

            const validItems = form.itemDetails.filter(item => item.itemId && item.quantity && item.purchasePrice);
            
            const updatedData = {
                ...form,
                purchaseDate: new Date(form.purchaseDate),
                poDate: form.poDate ? new Date(form.poDate) : null,
                itemDetails: validItems,
                updatedAt: serverTimestamp(),
            };

            await updateDoc(purchaseRef, updatedData);
            await updateInventoryStock(validItems);
            
            alert("✅ Purchase Updated & Inventory Adjusted!");
            
            setIsEditing(false);
            setCurrentPurchaseId(null);
            setForm(initialFormState);
            setVendorSearchTerm('');
            setItemSearchTerms([]);
            loadPurchases();
            setActiveTab('viewPurchases');
        } catch (error) {
            console.error("Error updating purchase: ", error);
            alert("Error updating purchase: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePurchase = async (purchaseId, itemDetailsToReverse) => {
        if (!window.confirm("Are you sure you want to delete this purchase? Stock will be reversed.")) {
            return;
        }

        setLoading(true);
        try {
            await reverseInventoryStock(itemDetailsToReverse);
            await deleteDoc(doc(db, "purchases", purchaseId));
            
            alert("✅ Purchase Deleted & Stock Reversed!");
            loadPurchases();
        } catch (error) {
            console.error("Error deleting purchase: ", error);
            alert("Error deleting purchase: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const PurchaseList = ({ handleDeletePurchase, handleEditClick }) => {
        const flatPurchases = purchases.flatMap(purchase => 
            purchase.itemDetails?.map((item, itemIndex) => ({
                key: `${purchase.id}-${itemIndex}`,
                purchaseId: purchase.id,
                vendorInvoiceNo: purchase.vendorInvoiceNo || 'N/A',
                purchaseDate: purchase.purchaseDate || 'N/A',
                itemName: item.itemName,
                purchasedQuantity: item.quantity,
                currentStock: getItemCurrentStock(item.itemId),
                purchasePrice: item.purchasePrice,
                isFirstRow: itemIndex === 0,
                rowSpan: itemIndex === 0 ? purchase.itemDetails.length : 0,
                fullPurchase: purchase
            })) || []
        );

        const listTableStyle = { width: '100%', borderCollapse: 'separate', borderSpacing: 0 };
        const listThStyle = { 
            padding: "15px", 
            textAlign: "left", 
            color: currentTheme.TEXT_MUTED, 
            fontSize: "13px", 
            textTransform: "uppercase", 
            fontWeight: "600", 
            borderBottom: `2px solid ${currentTheme.SIDEBAR_HOVER}`,
            background: currentTheme.SIDEBAR_BG
        };
        const listTdStyle = { 
            padding: "15px", 
            borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
            color: currentTheme.TEXT_PRIMARY
        };

        return (
            <div style={{ overflowX: 'auto', position: 'relative' }}>
                <table style={listTableStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...listThStyle, width: '10%' }}>Invoice No.</th> 
                            <th style={{ ...listThStyle, width: '10%' }}>Date</th>
                            <th style={{ ...listThStyle, width: '30%' }}>Item Name</th>
                            <th style={{ ...listThStyle, width: '10%', textAlign: 'center' }}>Purchased</th>
                            <th style={{ ...listThStyle, width: '10%', textAlign: 'center' }}>Current Stock</th>
                            <th style={{ ...listThStyle, width: '15%', textAlign: 'right' }}>Unit Price (Rs)</th> 
                            <th style={{ ...listThStyle, width: '15%', textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {flatPurchases.map((row, index) => (
                            <tr 
                                key={row.key} 
                                style={{ 
                                    background: index % 2 === 0 ? currentTheme.CARD_BG : currentTheme.SIDEBAR_HOVER,
                                }}
                            >
                                <td style={{ ...listTdStyle, color: currentTheme.TEXT_PRIMARY }}>
                                    {row.vendorInvoiceNo}
                                </td>
                                <td style={{ ...listTdStyle, color: currentTheme.TEXT_MUTED }}>
                                    {row.purchaseDate}
                                </td>
                                
                                <td style={listTdStyle}>
                                    <strong>{row.itemName}</strong>
                                </td>
                                <td style={{ ...listTdStyle, textAlign: 'center', color: currentTheme.TEXT_MUTED }}>
                                    {row.purchasedQuantity}
                                </td>
                                <td style={{ ...listTdStyle, textAlign: 'center', fontWeight: 'bold' }}>
                                    <span style={{ 
                                        color: row.currentStock === 0 ? currentTheme.ACCENT_DANGER : (row.currentStock < 5 ? currentTheme.WARNING : currentTheme.ACCENT_SUCCESS),
                                        padding: '3px 8px',
                                        background: row.currentStock === 0 ? `${currentTheme.ACCENT_DANGER}20` : (row.currentStock < 5 ? `${currentTheme.WARNING}20` : `${currentTheme.ACCENT_SUCCESS}20`),
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}>
                                        {row.currentStock}
                                    </span>
                                </td>
                                <td style={{ ...listTdStyle, textAlign: 'right', fontWeight: '700', color: currentTheme.ACCENT_SUCCESS }}>
                                    Rs {(row.purchasePrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                
                                <td style={{ ...listTdStyle, textAlign: 'center' }}>
                                    {row.isFirstRow && (
                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handleEditClick(row.fullPurchase)}
                                                style={{ 
                                                    background: currentTheme.ACCENT_INFO, 
                                                    border: 'none', 
                                                    color: '#fff', 
                                                    cursor: 'pointer', 
                                                    fontSize: '14px', 
                                                    padding: '5px 8px', 
                                                    borderRadius: '4px'
                                                }}
                                                title="Edit Purchase"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeletePurchase(row.purchaseId, row.fullPurchase.itemDetails)}
                                                style={{ 
                                                    background: currentTheme.ACCENT_DANGER, 
                                                    border: 'none', 
                                                    color: '#fff', 
                                                    cursor: 'pointer', 
                                                    fontSize: '14px', 
                                                    padding: '5px 8px', 
                                                    borderRadius: '4px'
                                                }}
                                                title="Delete Purchase and Reverse Stock"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const headerStyle = { fontSize: "26px", fontWeight: "700", margin: "0 0 8px 0", color: currentTheme.TEXT_PRIMARY };
    const subHeaderStyle = { fontSize: "14px", color: currentTheme.TEXT_MUTED, fontWeight: "400", margin: "0 0 20px 0" };
    const tabButtonStyle = (isActive) => ({ 
        padding: "10px 18px", 
        marginRight: "8px", 
        border: "none", 
        borderRadius: "8px 8px 0 0", 
        cursor: "pointer", 
        fontSize: "14px", 
        fontWeight: "600", 
        background: isActive ? currentTheme.CARD_BG : currentTheme.SIDEBAR_HOVER, 
        color: isActive ? currentTheme.PRIMARY : currentTheme.TEXT_MUTED, 
        borderBottom: isActive ? `3px solid ${currentTheme.PRIMARY}` : `3px solid ${currentTheme.SIDEBAR_HOVER}`, 
        transition: 'all 0.3s' 
    });
    const formGroupStyle = { marginBottom: "15px" };
    const labelStyle = { display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: currentTheme.TEXT_MUTED, textTransform: 'uppercase' };
    const inputStyle = { 
        width: "100%", 
        padding: "10px", 
        borderRadius: "6px", 
        border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, 
        background: currentTheme.SIDEBAR_BG, 
        color: currentTheme.TEXT_PRIMARY, 
        fontSize: "14px", 
        boxSizing: "border-box", 
        transition: 'border-color 0.2s' 
    };
    const itemInputStyle = { 
        ...inputStyle, 
        padding: '8px 10px', 
        border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, 
        background: currentTheme.CARD_BG, 
        color: currentTheme.TEXT_PRIMARY, 
        cursor: 'text', 
        boxShadow: 'none', 
        fontSize: '13px' 
    };
    const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '15px' };
    const thStyle = { 
        background: currentTheme.SIDEBAR_HOVER, 
        color: currentTheme.TEXT_MUTED, 
        padding: '10px 12px', 
        textAlign: 'left', 
        fontSize: '12px', 
        textTransform: 'uppercase', 
        fontWeight: '700', 
        borderBottom: `2px solid ${currentTheme.PRIMARY}` 
    };
    const compactTdStyle = { padding: '8px 12px', color: currentTheme.TEXT_PRIMARY, fontSize: '13px' };
    const autocompleteContainerStyle = { position: 'relative', width: '100%' };
    const suggestionsListStyle = {
        position: 'absolute',
        zIndex: 9999,
        width: '100%',
        maxHeight: '300px',
        overflowY: 'auto',
        background: currentTheme.CARD_BG,
        border: `1px solid ${currentTheme.PRIMARY}`,
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        marginTop: '4px',
        left: 0,
        right: 0,
    };
    const suggestionItemStyle = (isHighlighted) => ({
        padding: '10px',
        cursor: 'pointer',
        color: currentTheme.TEXT_PRIMARY,
        fontSize: '14px',
        borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
        background: isHighlighted ? currentTheme.SIDEBAR_HOVER : 'transparent',
        transition: 'background 0.15s',
    });

    return (
        <div style={{ padding: "0" }}>
            <h1 style={headerStyle}>📦 Head of Purchase</h1>
            <p style={subHeaderStyle}>
                Create and manage purchase orders to replenish inventory stock.
            </p>

            <div style={{ display: 'flex', marginBottom: '15px' }}>
                <button style={tabButtonStyle(activeTab === "addPurchase")} onClick={() => setActiveTab("addPurchase")}>
                    {isEditing ? `📝 Edit Purchase #${currentPurchaseId ? currentPurchaseId.substring(0, 5) : ''}` : "➕ Create New Purchase Order"}
                </button>
                <button style={tabButtonStyle(activeTab === "viewPurchases")} onClick={() => setActiveTab("viewPurchases")}>
                    📜 View Purchase History ({purchases.length})
                </button>
            </div>

            <div style={{
                background: currentTheme.CARD_BG,
                borderRadius: "12px",
                padding: "25px",
                boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
            }}>
                {activeTab === "addPurchase" && (
                    <form onSubmit={isEditing ? handleUpdatePurchase : handleSaveNewPurchase}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                            
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Select Vendor *</label>
                                <div style={autocompleteContainerStyle} ref={vendorSearchRef}>
                                    <input
                                        type="text"
                                        placeholder={form.vendorDocId ? `Vendor Selected: ${form.vendorName}` : "Search Vendor Name or ID..."}
                                        style={{ 
                                            ...inputStyle, 
                                            border: form.vendorDocId ? `1px solid ${currentTheme.ACCENT_SUCCESS}` : inputStyle.border 
                                        }}
                                        value={vendorSearchTerm}
                                        onChange={(e) => {
                                            setVendorSearchTerm(e.target.value);
                                            setShowVendorDropdown(true);
                                            setForm(prev => ({ ...prev, vendorDocId: "", vendorName: "" }));
                                        }}
                                        onFocus={() => setShowVendorDropdown(true)}
                                        onKeyDown={handleVendorKeyDown}
                                    />
                                    {showVendorDropdown && filteredVendors.length > 0 && (
                                        <ul style={suggestionsListStyle}>
                                            {filteredVendors.map((vendor, index) => (
                                                <li
                                                    key={vendor.id}
                                                    style={suggestionItemStyle(index === vendorActiveSuggestionIndex)}
                                                    onClick={() => handleVendorSelect(vendor)}
                                                    onMouseOver={() => setVendorActiveSuggestionIndex(index)}
                                                >
                                                    {vendor.vendorName} (ID: {vendor.vendorId})
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Vendor Invoice No.</label>
                                <input type="text" id="vendorInvoiceNo" name="vendorInvoiceNo" value={form.vendorInvoiceNo} onChange={handleFormChange} style={inputStyle} />
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle}>P.O. Date</label>
                                <input type="date" name="poDate" value={form.poDate} onChange={handleFormChange} style={inputStyle} />
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Purchase Date *</label>
                                <input type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleFormChange} style={inputStyle} required />
                            </div>
                        </div>

                        <h3 style={{ color: currentTheme.PRIMARY, fontSize: '18px', borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}`, paddingBottom: '5px', marginBottom: '10px' }}>Item Details</h3>
                        <div ref={itemTableScrollRef} style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '10px', marginBottom: '15px' }}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={{ ...thStyle, width: '40%' }}>Item *</th>
                                        <th style={{ ...thStyle, width: '15%', textAlign: 'center' }}>Quantity *</th>
                                        <th style={{ ...thStyle, width: '20%', textAlign: 'right' }}>Purchase Price (Rs) *</th>
                                        <th style={{ ...thStyle, width: '20%', textAlign: 'right' }}>Subtotal (Rs)</th>
                                        <th style={{ ...thStyle, width: '5%', textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.itemDetails.map((detail, index) => (
                                        <tr key={index}>
                                            <td style={compactTdStyle}>
                                                <div style={autocompleteContainerStyle} ref={el => itemSearchRefs.current[index] = el}>
                                                    <input
                                                        type="text"
                                                        placeholder="Search Item..."
                                                        value={itemSearchTerms[index]}
                                                        onChange={(e) => handleItemSearchChange(e, index)}
                                                        onFocus={() => setActiveItemSearchIndex(index)}
                                                        onKeyDown={(e) => handleItemKeyDown(e, index)}
                                                        style={itemInputStyle}
                                                    />
                                                    {activeItemSearchIndex === index && getFilteredItems(index).length > 0 && (
                                                        <ul style={suggestionsListStyle}>
                                                            {getFilteredItems(index).map((item, i) => (
                                                                <li
                                                                    key={item.id}
                                                                    style={suggestionItemStyle(i === itemActiveSuggestionIndex[index])}
                                                                    onClick={() => handleItemSelect(item, index)}
                                                                    onMouseOver={() => setItemActiveSuggestionIndex(prev => {
                                                                        const newIndices = [...prev];
                                                                        newIndices[index] = i;
                                                                        return newIndices;
                                                                    })}
                                                                >
                                                                    {item.itemName} (Stock: {getItemCurrentStock(item.id)})
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={compactTdStyle}>
                                                <input
                                                    id={`quantity-${index}`}
                                                    type="number"
                                                    min="1"
                                                    name="quantity"
                                                    value={detail.quantity}
                                                    onChange={(e) => handleItemDetailChange(index, e.target.name, e.target.value)}
                                                    style={{ ...itemInputStyle, textAlign: 'center' }}
                                                />
                                            </td>
                                            <td style={compactTdStyle}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    name="purchasePrice"
                                                    value={detail.purchasePrice}
                                                    onChange={(e) => handleItemDetailChange(index, e.target.name, e.target.value)}
                                                    style={{ ...itemInputStyle, textAlign: 'right' }}
                                                />
                                            </td>
                                            <td style={{ ...compactTdStyle, textAlign: 'right', fontWeight: 'bold', color: currentTheme.ACCENT_INFO }}>
                                                {parseFloat(detail.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ ...compactTdStyle, textAlign: 'center' }}>
                                                <button type="button" onClick={() => removeItemRow(index)} style={{ background: 'none', border: 'none', color: currentTheme.ACCENT_DANGER, cursor: 'pointer', fontSize: '16px' }} title="Remove Item">
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button type="button" onClick={addItemRow} style={{ padding: '8px 15px', background: currentTheme.PRIMARY, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                            + Add Item Row
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
                            <div>
                                <h3 style={{ color: currentTheme.PRIMARY, fontSize: '18px', borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}`, paddingBottom: '5px', marginBottom: '10px' }}>Financial Summary</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Additional Discount (Rs)</label>
                                        <input type="number" min="0" step="0.01" name="additionalDiscount" value={form.additionalDiscount} onChange={handleFormChange} style={inputStyle} />
                                    </div>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Carriage/Freight (Rs)</label>
                                        <input type="number" min="0" step="0.01" name="carriageAndFreight" value={form.carriageAndFreight} onChange={handleFormChange} style={inputStyle} />
                                    </div>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Amount Paid (Rs) *</label>
                                        <input type="number" min="0" step="0.01" name="amountPaid" value={form.amountPaid} onChange={handleFormChange} style={inputStyle} required />
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ background: currentTheme.SIDEBAR_BG, padding: '15px', borderRadius: '8px', border: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                                <h4 style={{ color: currentTheme.TEXT_MUTED, margin: '0 0 10px 0', borderBottom: `1px solid ${currentTheme.TEXT_MUTED}`, paddingBottom: '5px' }}>ORDER TOTALS</h4>
                                <p style={{ color: currentTheme.TEXT_PRIMARY, display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                                    Subtotal: <span>Rs {form.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </p>
                                <p style={{ color: currentTheme.TEXT_PRIMARY, display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                                    Discount: <span style={{ color: currentTheme.ACCENT_DANGER }}>- Rs {parseFloat(form.additionalDiscount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </p>
                                <p style={{ color: currentTheme.TEXT_PRIMARY, display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', borderBottom: `1px dashed ${currentTheme.TEXT_MUTED}`, paddingBottom: '10px' }}>
                                    Freight: <span>+ Rs {parseFloat(form.carriageAndFreight).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </p>
                                <h3 style={{ color: currentTheme.ACCENT_SUCCESS, display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
                                    NET TOTAL: <span>Rs {form.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </h3>
                                <h3 style={{ color: currentTheme.PRIMARY, display: 'flex', justifyContent: 'space-between', margin: '10px 0', borderTop: `1px solid ${currentTheme.SIDEBAR_HOVER}`, paddingTop: '10px' }}>
                                    BALANCE: <span>Rs {form.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </h3>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            style={{ 
                                marginTop: '20px', 
                                padding: '12px 25px', 
                                background: isEditing ? currentTheme.ACCENT_INFO : currentTheme.PRIMARY, 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: '8px', 
                                cursor: loading ? 'not-allowed' : 'pointer', 
                                fontSize: '16px', 
                                fontWeight: '700',
                                width: '100%',
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            {loading ? 'Processing...' : (isEditing ? '💾 Update Purchase' : '📦 Save Purchase Order')}
                        </button>

                         {isEditing && (
                            <button 
                                type="button" 
                                onClick={() => {
                                    setIsEditing(false);
                                    setCurrentPurchaseId(null);
                                    setForm(initialFormState);
                                    setVendorSearchTerm('');
                                    setItemSearchTerms([]);
                                }}
                                disabled={loading} 
                                style={{ 
                                    marginTop: '10px', 
                                    padding: '10px 20px', 
                                    background: currentTheme.TEXT_MUTED,
                                    color: '#fff', 
                                    border: 'none', 
                                    borderRadius: '8px', 
                                    cursor: loading ? 'not-allowed' : 'pointer', 
                                    fontSize: '14px', 
                                    fontWeight: '600',
                                    width: '100%',
                                    opacity: loading ? 0.6 : 1
                                }}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </form>
                )}

                {activeTab === "viewPurchases" && (
                    <PurchaseList 
                        handleDeletePurchase={handleDeletePurchase} 
                        handleEditClick={handleEditClick}
                    />
                )}
            </div>
        </div>
    );
};

export default PurchaseManager;