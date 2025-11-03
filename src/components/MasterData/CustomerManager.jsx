import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore'; 

// ❌ THEME object DELETE ho gaya

// ✅ currentTheme prop ADD ho gaya
const CustomerManager = ({ db, customers, setCustomers, currentTheme }) => {
    const [nextCustomerId, setNextCustomerId] = useState(1001); 
    const [customerType, setCustomerType] = useState('Cash'); 
    const [customerForm, setCustomerForm] = useState({
        customerId: '',
        customerName: '',
        address: '',
        phone: '',
        creditLimit: '0',
    });
    const [loadingCustomer, setLoadingCustomer] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    useEffect(() => {
        setCustomerForm(prev => ({ ...prev, customerId: nextCustomerId.toString() }));
    }, [nextCustomerId]);

    const loadCustomers = async () => {
        try {
            const customersCol = collection(db, 'customers');
            const customerSnapshot = await getDocs(customersCol);
            const customerList = customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            let maxId = 1000;
            if (customerList.length > 0) {
                maxId = Math.max(...customerList.map(c => parseInt(c.customerId) || 1000));
            }
            setNextCustomerId(maxId + 1);
            
            setCustomers(customerList);
        } catch (error) {
            console.error("Error loading customers: ", error);
            alert("Error loading customers. Check console.");
        }
    };
    
    const handleCustomerTypeChange = (type) => {
        setCustomerType(type);
        if (type === 'Cash') {
            setCustomerForm(prev => ({ ...prev, creditLimit: '0' }));
        }
    };

    const handleCustomerInputChange = (e) => {
        const { name, value } = e.target;
        setCustomerForm(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveCustomer = async () => {
        if (!customerForm.customerName || !customerForm.address || !customerForm.phone) {
            alert("Please fill all required fields: Name, Address, and Phone.");
            return;
        }

        if (customerType === 'Credit' && parseFloat(customerForm.creditLimit) <= 0) {
            alert("Credit customer must have a credit limit greater than 0.");
            return;
        }

        setLoadingCustomer(true);

        try {
            const customersCol = collection(db, 'customers');
            await addDoc(customersCol, {
                ...customerForm,
                customerType: customerType,
                creditLimit: customerType === 'Cash' ? 0 : parseFloat(customerForm.creditLimit),
                createdAt: new Date().toISOString(),
            });

            alert(`Customer "${customerForm.customerName}" saved successfully!`);
            setCustomerForm({
                customerId: (nextCustomerId + 1).toString(),
                customerName: '',
                address: '',
                phone: '',
                creditLimit: customerType === 'Cash' ? '0' : customerForm.creditLimit,
            });
            loadCustomers();
            
        } catch (error) {
            console.error("Error saving customer: ", error);
            alert("Error saving customer. Check console.");
        } finally {
            setLoadingCustomer(false);
        }
    };
    
    const handleDeleteCustomer = async (customerDocId, customerName) => {
        if (window.confirm(`Are you sure you want to delete customer: ${customerName}?`)) {
            try {
                await deleteDoc(doc(db, 'customers', customerDocId));
                alert(`Customer "${customerName}" deleted successfully!`);
                loadCustomers();
            } catch (error) {
                console.error("Error deleting customer: ", error);
                alert("Error deleting customer. Check console.");
            }
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '36px' }}>
                <h1 style={{ fontSize: '30px', fontWeight: '700', margin: '0 0 4px 0', color: currentTheme.TEXT_PRIMARY }}>New Customer 🤝</h1>
                <p style={{ fontSize: '15px', color: currentTheme.TEXT_SECONDARY, margin: 0 }}>Register cash or credit customers for sales tracking.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
                <div style={{ background: currentTheme.CARD_BG, padding: '40px', borderRadius: '12px', boxShadow: currentTheme.SHADOW_MD, border: `1px solid ${currentTheme.SIDEBAR_HOVER}` }}>
                    <div style={{ marginBottom: '28px', display: 'flex', gap: '16px', alignItems: 'center', background: currentTheme.SIDEBAR_BG, padding: '10px', borderRadius: '8px' }}>
                        <label style={{ fontWeight: '600', fontSize: '14px', color: currentTheme.TEXT_PRIMARY, flexShrink: 0 }}>Customer Type:</label>
                        <button 
                            onClick={() => handleCustomerTypeChange('Cash')} 
                            style={{ 
                                background: customerType === 'Cash' ? currentTheme.GRADIENT_PRIMARY : 'transparent', 
                                color: customerType === 'Cash' ? 'white' : currentTheme.PRIMARY, 
                                padding: '8px 16px', 
                                border: `1px solid ${currentTheme.PRIMARY}`, 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontSize: '14px', 
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}>
                            Cash
                        </button>
                        <button 
                            onClick={() => handleCustomerTypeChange('Credit')} 
                            style={{ 
                                background: customerType === 'Credit' ? currentTheme.GRADIENT_PRIMARY : 'transparent', 
                                color: customerType === 'Credit' ? 'white' : currentTheme.PRIMARY, 
                                padding: '8px 16px', 
                                border: `1px solid ${currentTheme.PRIMARY}`,
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
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: currentTheme.TEXT_PRIMARY }}>Customer ID (Autofilled)</label>
                        <input type="text" value={customerForm.customerId} disabled style={{ width: '100%', padding: '14px 16px', border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', background: currentTheme.SIDEBAR_BG, color: currentTheme.TEXT_MUTED }} />
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: currentTheme.TEXT_PRIMARY }}>Customer Name *</label>
                        <input type="text" name="customerName" placeholder="e.g., Ali Khan" value={customerForm.customerName} onChange={handleCustomerInputChange} style={{ width: '100%', padding: '14px 16px', border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', background: currentTheme.SIDEBAR_BG, color: currentTheme.TEXT_PRIMARY }} />
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: currentTheme.TEXT_PRIMARY }}>Customer Address *</label>
                        <input type="text" name="address" placeholder="e.g., Gulshan-e-Iqbal, Karachi" value={customerForm.address} onChange={handleCustomerInputChange} style={{ width: '100%', padding: '14px 16px', border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', background: currentTheme.SIDEBAR_BG, color: currentTheme.TEXT_PRIMARY }} />
                    </div>
                    
                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: currentTheme.TEXT_PRIMARY }}>Customer Phone *</label>
                        <input type="tel" name="phone" placeholder="e.g., 03xx-xxxxxxx" value={customerForm.phone} onChange={handleCustomerInputChange} style={{ width: '100%', padding: '14px 16px', border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', background: currentTheme.SIDEBAR_BG, color: currentTheme.TEXT_PRIMARY }} />
                    </div>

                    {customerType === 'Credit' && (
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: currentTheme.TEXT_PRIMARY }}>Credit Limit (Rs) *</label>
                            <input type="number" name="creditLimit" placeholder="e.g., 25000" value={customerForm.creditLimit} onChange={handleCustomerInputChange} style={{ width: '100%', padding: '14px 16px', border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', background: currentTheme.SIDEBAR_BG, color: currentTheme.TEXT_PRIMARY }} />
                            <p style={{ fontSize: '12px', color: currentTheme.PRIMARY, margin: '6px 0 0 0' }}>**Only for Credit Customers**</p>
                        </div>
                    )}
                    
                    <button 
                        onClick={handleSaveCustomer} 
                        disabled={loadingCustomer}
                        style={{ background: currentTheme.GRADIENT_PRIMARY, color: 'white', padding: '14px 36px', border: 'none', borderRadius: '8px', cursor: loadingCustomer ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '600', opacity: loadingCustomer ? 0.7 : 1, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', transition: 'all 0.3s' }}
                        onMouseEnter={(e) => {
                            if (!loadingCustomer) {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.4)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                        }}>
                        {loadingCustomer ? 'Saving Customer...' : 'Save Customer'}
                    </button>
                </div>

                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 16px 0', color: currentTheme.TEXT_PRIMARY }}>Saved Customers ({customers.length})</h2>
                    <div style={{ background: currentTheme.CARD_BG, borderRadius: '12px', boxShadow: currentTheme.SHADOW_MD, border: `1px solid ${currentTheme.SIDEBAR_HOVER}`, maxHeight: '600px', overflowY: 'auto' }}>
                        {customers.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: currentTheme.TEXT_MUTED, fontSize: '14px' }}>No customers yet</div>
                        ) : (
                            customers.map((cust, idx) => (
                                <div key={cust.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: idx !== customers.length - 1 ? `1px solid ${currentTheme.SIDEBAR_HOVER}` : 'none' }}>
                                    <div>
                                        <p style={{ fontSize: '15px', fontWeight: '600', color: currentTheme.TEXT_PRIMARY, margin: '0 0 4px 0' }}>
                                            {cust.customerName} 
                                            <span style={{ marginLeft: '10px', background: cust.customerType === 'Credit' ? `${currentTheme.PRIMARY}20` : `${currentTheme.ACCENT_SUCCESS}20`, color: cust.customerType === 'Credit' ? currentTheme.PRIMARY : currentTheme.ACCENT_SUCCESS, fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px' }}>
                                                {cust.customerType}
                                            </span>
                                        </p>
                                        <p style={{ fontSize: '13px', color: currentTheme.TEXT_MUTED, margin: '0 0 4px 0' }}>ID: {cust.customerId} | Ph: {cust.phone}</p>
                                        {cust.customerType === 'Credit' && (
                                            <p style={{ fontSize: '13px', color: '#f59e0b', margin: 0, fontWeight: '600' }}>Limit: Rs {cust.creditLimit}</p>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteCustomer(cust.id, cust.customerName)} 
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

export default CustomerManager;