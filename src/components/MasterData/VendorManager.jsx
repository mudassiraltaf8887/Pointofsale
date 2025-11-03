import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore'; 

// ❌ THEME object DELETE ho gaya

// ✅ currentTheme prop ADD ho gaya
const VendorManager = ({ db, vendors, setVendors, currentTheme }) => {
    const [nextVendorId, setNextVendorId] = useState(2001); 
    const [vendorType, setVendorType] = useState('Cash'); 
    const [vendorForm, setVendorForm] = useState({
        vendorId: '',
        vendorName: '',
        vendorAddress: '',
        vendorPhone: '',
        creditLimit: '0', 
    });
    const [loadingVendor, setLoadingVendor] = useState(false);

    useEffect(() => {
        loadVendors();
    }, []);

    useEffect(() => {
        setVendorForm(prev => ({ ...prev, vendorId: nextVendorId.toString() }));
    }, [nextVendorId]);

    const loadVendors = async () => {
        try {
            const vendorsCol = collection(db, 'vendors');
            const vendorSnapshot = await getDocs(vendorsCol);
            const vendorList = vendorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            let maxId = 2000;
            if (vendorList.length > 0) {
                maxId = Math.max(...vendorList.map(v => parseInt(v.vendorId) || 2000));
            }
            setNextVendorId(maxId + 1);
            
            setVendors(vendorList);
        } catch (error) {
            console.error("Error loading vendors: ", error);
        }
    };
    
    const handleVendorTypeChange = (type) => {
        setVendorType(type);
        if (type === 'Cash') {
            setVendorForm(prev => ({ ...prev, creditLimit: '0' }));
        }
    };

    const handleVendorInputChange = (e) => {
        const { name, value } = e.target;
        setVendorForm(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveVendor = async () => {
        if (!vendorForm.vendorName || !vendorForm.vendorAddress || !vendorForm.vendorPhone) {
            alert("Please fill all required fields: Name, Address, and Phone.");
            return;
        }

        if (vendorType === 'Credit' && parseFloat(vendorForm.creditLimit) <= 0) {
            alert("Credit vendor must have a credit limit greater than 0.");
            return;
        }

        setLoadingVendor(true);

        try {
            const vendorsCol = collection(db, 'vendors');
            await addDoc(vendorsCol, {
                ...vendorForm,
                vendorType: vendorType,
                creditLimit: vendorType === 'Cash' ? 0 : parseFloat(vendorForm.creditLimit), 
                createdAt: new Date().toISOString(),
            });

            alert(`Vendor "${vendorForm.vendorName}" saved successfully!`);
            setVendorForm({
                vendorId: (nextVendorId + 1).toString(),
                vendorName: '',
                vendorAddress: '',
                vendorPhone: '',
                creditLimit: vendorType === 'Cash' ? '0' : vendorForm.creditLimit,
            });
            loadVendors();
            
        } catch (error) {
            console.error("Error saving vendor: ", error);
            alert("Error saving vendor. Check console.");
        } finally {
            setLoadingVendor(false);
        }
    };
    
    const handleDeleteVendor = async (vendorDocId, vendorName) => {
        if (window.confirm(`Are you sure you want to delete vendor: ${vendorName}?`)) {
            try {
                await deleteDoc(doc(db, 'vendors', vendorDocId));
                alert(`Vendor "${vendorName}" deleted successfully!`);
                loadVendors();
            } catch (error) {
                console.error("Error deleting vendor: ", error);
                alert("Error deleting vendor. Check console.");
            }
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '36px' }}>
                <h1 style={{ fontSize: '30px', fontWeight: '700', margin: '0 0 4px 0', color: currentTheme.TEXT_PRIMARY }}>New Vendor 🏭</h1>
                <p style={{ fontSize: '15px', color: currentTheme.TEXT_SECONDARY, margin: 0 }}>Register suppliers for managing purchases and credit terms.</p>
            </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
                <div style={{ background: currentTheme.CARD_BG, padding: '40px', borderRadius: '12px', boxShadow: currentTheme.SHADOW_MD, border: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                    <div style={{ marginBottom: '28px', display: 'flex', gap: '16px', alignItems: 'center', background: currentTheme.SIDEBAR_BG, padding: '10px', borderRadius: '8px' }}>
                        <label style={{ fontWeight: '600', fontSize: '14px', color: currentTheme.TEXT_PRIMARY, flexShrink: 0 }}>Vendor Type:</label>
                        <button 
                            onClick={() => handleVendorTypeChange('Cash')} 
                            style={{ 
                                background: vendorType === 'Cash' ? currentTheme.GRADIENT_SUCCESS : 'transparent', 
                                color: vendorType === 'Cash' ? 'white' : currentTheme.ACCENT_SUCCESS, 
                                padding: '8px 16px', 
                                border: `1px solid ${currentTheme.ACCENT_SUCCESS}`, 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontSize: '14px', 
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}>
                            Cash
                        </button>
                        <button 
                            onClick={() => handleVendorTypeChange('Credit')} 
                            style={{ 
                                background: vendorType === 'Credit' ? currentTheme.GRADIENT_SUCCESS : 'transparent', 
                                color: vendorType === 'Credit' ? 'white' : currentTheme.ACCENT_SUCCESS, 
                                padding: '8px 16px', 
                                border: `1px solid ${currentTheme.ACCENT_SUCCESS}`,
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontSize: '14px', 
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}>
                            Credit
                        </button>
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: currentTheme.TEXT_PRIMARY }}>Vendor ID (Autofilled)</label>
                        <input type="text" value={vendorForm.vendorId} disabled style={{ width: '100%', padding: '14px 16px', border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', background: currentTheme.SIDEBAR_BG, color: currentTheme.TEXT_MUTED }} />
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: currentTheme.TEXT_PRIMARY }}>Vendor Name *</label>
                        <input type="text" name="vendorName" placeholder="e.g., ABC Suppliers" value={vendorForm.vendorName} onChange={handleVendorInputChange} style={{ width: '100%', padding: '14px 16px', border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', background: currentTheme.SIDEBAR_BG, color: currentTheme.TEXT_PRIMARY }} />
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: currentTheme.TEXT_PRIMARY }}>Vendor Address *</label>
                        <input type="text" name="vendorAddress" placeholder="e.g., Street 5, Lahore" value={vendorForm.vendorAddress} onChange={handleVendorInputChange} style={{ width: '100%', padding: '14px 16px', border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', background: currentTheme.SIDEBAR_BG, color: currentTheme.TEXT_PRIMARY }} />
                    </div>
                    
                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: currentTheme.TEXT_PRIMARY }}>Vendor Phone *</label>
                        <input type="tel" name="vendorPhone" placeholder="e.g., 03xx-xxxxxxx" value={vendorForm.vendorPhone} onChange={handleVendorInputChange} style={{ width: '100%', padding: '14px 16px', border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', background: currentTheme.SIDEBAR_BG, color: currentTheme.TEXT_PRIMARY }} />
                    </div>

                    {vendorType === 'Credit' && (
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: currentTheme.TEXT_PRIMARY }}>Credit Limit (Rs) *</label>
                            <input type="number" name="creditLimit" placeholder="e.g., 50000" value={vendorForm.creditLimit} onChange={handleVendorInputChange} style={{ width: '100%', padding: '14px 16px', border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', background: currentTheme.SIDEBAR_BG, color: currentTheme.TEXT_PRIMARY }} />
                            <p style={{ fontSize: '12px', color: currentTheme.PRIMARY, margin: '6px 0 0 0' }}>**Only for Credit Vendors**</p>
                        </div>
                    )}
                    
                    <button 
                        onClick={handleSaveVendor} 
                        disabled={loadingVendor}
                        style={{ background: currentTheme.GRADIENT_SUCCESS, color: 'white', padding: '14px 36px', border: 'none', borderRadius: '8px', cursor: loadingVendor ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '600', opacity: loadingVendor ? 0.7 : 1, boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)', transition: 'all 0.3s' }}
                        onMouseEnter={(e) => {
                            if (!loadingVendor) {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 6px 16px rgba(34, 197, 94, 0.4)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(34, 197, 94, 0.3)";
                        }}>
                        {loadingVendor ? 'Saving Vendor...' : 'Save Vendor'}
                    </button>
                </div>

                <div> 
                    <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 16px 0', color: currentTheme.TEXT_PRIMARY }}>Saved Vendors ({vendors.length})</h2>
                    <div style={{ background: currentTheme.CARD_BG, borderRadius: '12px', boxShadow: currentTheme.SHADOW_MD, border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, maxHeight: '600px', overflowY: 'auto' }}>
                        {vendors.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: currentTheme.TEXT_MUTED, fontSize: '14px' }}>No vendors yet</div>
                        ) : (
                            vendors.map((vend, idx) => (
                                <div key={vend.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: idx !== vendors.length - 1 ? `1px solid ${currentTheme.SIDEBAR_HOVER}` : 'none' }}>
                                    <div>
                                        <p style={{ fontSize: '15px', fontWeight: '600', color: currentTheme.TEXT_PRIMARY, margin: '0 0 4px 0' }}>
                                            {vend.vendorName} 
                                            <span style={{ marginLeft: '10px', background: vend.vendorType === 'Credit' ? `${currentTheme.PRIMARY}20` : `${currentTheme.ACCENT_SUCCESS}20`, color: vend.vendorType === 'Credit' ? currentTheme.PRIMARY : currentTheme.ACCENT_SUCCESS, fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px' }}>
                                                {vend.vendorType}
                                            </span>
                                        </p>
                                        <p style={{ fontSize: '13px', color: currentTheme.TEXT_MUTED, margin: '0 0 4px 0' }}>ID: {vend.vendorId} | Ph: {vend.vendorPhone}</p>
                                        {vend.vendorType === 'Credit' && (
                                            <p style={{ fontSize: '13px', color: '#f59e0b', margin: 0, fontWeight: '600' }}>Limit: Rs {vend.creditLimit}</p>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteVendor(vend.id, vend.vendorName)} 
                                        style={{ 
                                            background: `${currentTheme.PRIMARY}20`, 
                                            color: currentTheme.PRIMARY, 
                                            padding: '8px 16px', 
                                            border: `1px solid ${currentTheme.PRIMARY}40`, 
                                            borderRadius: '6px', 
                                            cursor: 'pointer', 
                                            fontSize: '13px', 
                                            fontWeight: '600',
                                            flexShrink: 0,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = currentTheme.PRIMARY;
                                            e.currentTarget.style.color = "white";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = `${currentTheme.PRIMARY}20`;
                                            e.currentTarget.style.color = currentTheme.PRIMARY;
                                        }}>
                                        Delete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorManager;