import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import OverviewTab from './components/Tabs/OverviewTab';
import SimulatorTab from './components/Tabs/SimulatorTab';
import DeficitsTab from './components/Tabs/DeficitsTab';
import NegotiationsTab from './components/Tabs/NegotiationsTab';
import QuotesTab from './components/Tabs/QuotesTab';
import InventoryTab from './components/Tabs/InventoryTab';
import StockLogTab from './components/Tabs/StockLogTab';
import { Save, Search, Bell, Globe, HelpCircle, Mail, MessageSquare, Sliders, RotateCw } from 'lucide-react';

const getChannelIcon = (source, size = 12) => {
  const src = (source || 'email').toLowerCase();
  if (src === 'whatsapp') {
    return <MessageSquare size={size} style={{ color: '#25D366' }} />;
  }
  if (src === 'custom') {
    return <Sliders size={size} style={{ color: '#6366F1' }} />;
  }
  return <Mail size={size} style={{ color: '#3B82F6' }} />;
};

const renderChannelBadge = (source) => {
  const src = (source || 'email').toLowerCase();
  let label = 'Email';
  let bgColor = '#EFF6FF';
  let textColor = '#2563EB';
  let borderColor = '#BFDBFE';
  let icon = <Mail size={10} />;

  if (src === 'whatsapp') {
    label = 'WhatsApp';
    bgColor = '#ECFDF5';
    textColor = '#059669';
    borderColor = '#A7F3D0';
    icon = <MessageSquare size={10} />;
  } else if (src === 'custom') {
    label = 'Manual';
    bgColor = '#F5F3FF';
    textColor = '#7C3AED';
    borderColor = '#DDD6FE';
    icon = <Sliders size={10} />;
  }

  return (
    <span style={{
      fontSize: '0.62rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.2rem',
      background: bgColor,
      color: textColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '4px',
      padding: '0.08rem 0.3rem'
    }}>
      {icon} {label}
    </span>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('default');
  
  // Badge counts
  const [deficitsCount, setDeficitsCount] = useState(0);
  const [negsCount, setNegsCount] = useState(0);

  // Toast notifications state
  const [toast, setToast] = useState(null);

  // Invoice / quote filter state across tabs
  const [invoiceFilter, setInvoiceFilter] = useState('');

  // Global Comparison Modal states
  const [showGlobalComparison, setShowGlobalComparison] = useState(false);
  const [globalComparisonInvoiceId, setGlobalComparisonInvoiceId] = useState('');
  const [globalComparisonCustName, setGlobalComparisonCustName] = useState('');
  const [globalChatLogs, setGlobalChatLogs] = useState([]);
  const [globalChatItems, setGlobalChatItems] = useState([]);
  const [loadingGlobalChat, setLoadingGlobalChat] = useState(false);
  const [globalQuotation, setGlobalQuotation] = useState(null);

  const loadGlobalChatHistory = async (invoiceId) => {
    setLoadingGlobalChat(true);
    setGlobalChatLogs([]);
    setGlobalChatItems([]);
    setGlobalQuotation(null);
    try {
      const detailsRes = await fetch(`/api/quote/details/${invoiceId}?tenant_id=${selectedTenant}`);
      if (detailsRes.ok) {
        const detailsJson = await detailsRes.json();
        setGlobalQuotation(detailsJson.quotation || null);
        setGlobalChatLogs(detailsJson.logs || []);
        setGlobalChatItems(detailsJson.items || []);
      }
    } catch (e) {
      showToast('Error loading chat history: ' + e.message, 'error');
    } finally {
      setLoadingGlobalChat(false);
    }
  };

  useEffect(() => {
    if (globalComparisonInvoiceId && showGlobalComparison) {
      loadGlobalChatHistory(globalComparisonInvoiceId);
    }
  }, [globalComparisonInvoiceId, showGlobalComparison]);

  const openGlobalComparison = (invoiceId, customerName) => {
    setGlobalComparisonInvoiceId(invoiceId);
    setGlobalComparisonCustName(customerName);
    setShowGlobalComparison(true);
  };

  const navigateToTab = (tabName, filterValue = '') => {
    setInvoiceFilter(filterValue);
    setActiveTab(tabName);
  };

  // Shared Inventory Update Modal state
  const [showInvModal, setShowInvModal] = useState(false);
  const [invModalSkuId, setInvModalSkuId] = useState('');
  const [invModalSkuName, setInvModalSkuName] = useState('');
  const [invModalStock, setInvModalStock] = useState(0);
  const [invModalCallback, setInvModalCallback] = useState(null);
  const [savingStock, setSavingStock] = useState(false);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadTenants = async () => {
    try {
      const res = await fetch('/api/tenants');
      const data = await res.json();
      setTenants(data || []);
    } catch (e) {
      showToast('Error loading tenants list.', 'error');
    }
  };

  const refreshBadges = async () => {
    try {
      const [defRes, negRes] = await Promise.all([
        fetch(`/api/deficits?tenant_id=${selectedTenant}`),
        fetch(`/api/negotiations/escalated?tenant_id=${selectedTenant}`)
      ]);
      const defData = await defRes.json();
      const negData = await negRes.json();
      
      const pending = (defData.deficits || []).filter(d => d.status === 'PENDING').length;
      const negs = negData.count || 0;
      
      setDeficitsCount(pending);
      setNegsCount(negs);
    } catch (e) { /* silently ignore badge load failure */ }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    refreshBadges();
    // Setup background poller
    const interval = setInterval(refreshBadges, 8000);
    return () => clearInterval(interval);
  }, [selectedTenant]);

  const openInventoryModal = (skuId, skuName, currentStock, callback) => {
    setInvModalSkuId(skuId);
    setInvModalSkuName(skuName);
    setInvModalStock(currentStock);
    setInvModalCallback(() => callback);
    setShowInvModal(true);
  };

  const handleSaveStock = async () => {
    setSavingStock(true);
    try {
      const res = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku_id: invModalSkuId,
          new_stock: parseInt(invModalStock),
          tenant_id: selectedTenant
        })
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        showToast('Stock level updated successfully!', 'success');
        setShowInvModal(false);
        if (invModalCallback) invModalCallback();
        refreshBadges();
      } else {
        showToast(data.message || 'Error updating stock level.', 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setSavingStock(false);
    }
  };

  const pageTitles = {
    'overview': 'Executive Analytics Dashboard',
    'simulator': 'Live Simulator',
    'deficits': 'Deficits Manager',
    'negotiations': 'Price Negotiations Desk',
    'quotes': 'Quotation Repository',
    'inventory': 'Full Catalog Inventory',
    'stocklog': 'Stock Update Audit Log'
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setInvoiceFilter(''); // Clear invoiceFilter on sidebar click
          setActiveTab(tab);
        }}
        deficitsCount={deficitsCount}
        negsCount={negsCount}
      />

      {/* Main Container */}
      <div className="main-container">
        
        {/* Header styled like Aurora */}
        <header className="main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 2rem', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', height: '60px' }}>
          {/* Header Left: Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', borderRadius: '24px', padding: '0.45rem 1rem', width: '300px', border: '1px solid #E2E8F0' }}>
            <Search size={15} style={{ color: '#94A3B8', marginRight: '0.5rem' }} />
            <input 
              type="text" 
              placeholder="Search..." 
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.78rem', color: '#0F172A', width: '100%' }}
              title="Global search across system resources"
              disabled
            />
          </div>

          {/* Header Right: Controls & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            
            {/* Tenant Selector Dropdown */}
            <select
              className="tenant-selector"
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
              title="Select the active branch/tenant (e.g. Trofeo Hardware) to view branch-specific data."
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                fontSize: '0.78rem',
                fontWeight: '600',
                color: '#334155',
                background: '#F8FAFC',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            {/* Connection Status */}
            <div className="live-indicator" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', fontWeight: '600', color: '#059669', background: '#ECFDF5', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid #A7F3D0' }} title="Status of your system's connection to Odoo and the email server.">
              <div className="live-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></div>
              Connected
            </div>

            {/* Language / Globe Icon */}
            <button style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Regional Settings">
              <Globe size={18} />
            </button>

            {/* Help/Documentation */}
            <button style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Documentation">
              <HelpCircle size={18} />
            </button>

            {/* Notifications Bell */}
            <button style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative' }} title="System Notifications">
              <Bell size={18} />
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '5px', height: '5px', borderRadius: '50%', background: '#EF4444' }} />
            </button>

            {/* User Profile Avatar with Online Dot */}
            <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="User Profile">
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {/* Clean SVG Profile Avatar */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span style={{ position: 'absolute', bottom: '0', right: '0', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', border: '2px solid #FFFFFF' }} />
            </div>

          </div>
        </header>

        {/* Tab Content Panels */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'overview' && (
            <OverviewTab
              tenantId={selectedTenant}
              showToast={showToast}
              setActiveTab={setActiveTab}
              navigateToTab={navigateToTab}
              openQuoteComparison={openGlobalComparison}
            />
          )}
          {activeTab === 'simulator' && (
            <SimulatorTab
              tenantId={selectedTenant}
              showToast={showToast}
              refreshBadges={refreshBadges}
              invoiceFilter={invoiceFilter}
              setInvoiceFilter={setInvoiceFilter}
            />
          )}
          {activeTab === 'deficits' && (
            <DeficitsTab
              tenantId={selectedTenant}
              showToast={showToast}
              refreshBadges={refreshBadges}
              invoiceFilter={invoiceFilter}
              setInvoiceFilter={setInvoiceFilter}
            />
          )}
          {activeTab === 'negotiations' && (
            <NegotiationsTab
              tenantId={selectedTenant}
              showToast={showToast}
              refreshBadges={refreshBadges}
              invoiceFilter={invoiceFilter}
              setInvoiceFilter={setInvoiceFilter}
            />
          )}
          {activeTab === 'quotes' && (
            <QuotesTab
              tenantId={selectedTenant}
              showToast={showToast}
              openInventoryModal={openInventoryModal}
              invoiceFilter={invoiceFilter}
              setInvoiceFilter={setInvoiceFilter}
            />
          )}
          {activeTab === 'inventory' && (
            <InventoryTab
              tenantId={selectedTenant}
              showToast={showToast}
              openInventoryModal={openInventoryModal}
            />
          )}
          {activeTab === 'stocklog' && (
            <StockLogTab
              tenantId={selectedTenant}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Toast Messages Manager */}
      {toast && (
        <div id="toast-container">
          <div className={`toast ${toast.type}`}>
            <span className="toast-msg">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Shared Inventory Update Modal */}
      {showInvModal && (
        <div className="modal-overlay open">
          <div className="modal-box">
            <div className="modal-header">
              <h3>✏️ Update Stock Quantity</h3>
              <button className="modal-close" onClick={() => setShowInvModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="deficit-meta">
                <div className="meta-row"><span>SKU ID</span><span><code>{invModalSkuId}</code></span></div>
                <div className="meta-row"><span>Product</span><span>{invModalSkuName}</span></div>
              </div>
              <hr className="divider" />
              
              <div className="form-group">
                <label className="form-label">New Stock Level (On-Hand)</label>
                <input
                  type="number"
                  value={invModalStock}
                  onChange={e => setInvModalStock(e.target.value)}
                  className="form-control"
                  min="0"
                  placeholder="Enter new stock level…"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveStock();
                    }
                  }}
                />
                <p className="text-muted text-sm mt-1">This will update the catalog stock level on disk immediately.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowInvModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveStock} disabled={savingStock}>
                {savingStock ? <div className="spinner"></div> : <Save size={14} />} 
                {savingStock ? 'Saving...' : 'Save Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Transaction Log Comparison Modal */}
      {showGlobalComparison && (() => {
        const activeSource = globalQuotation?.source || 'email';
        
        const getDisplayLogs = () => {
          if (globalChatLogs && globalChatLogs.length > 0) return globalChatLogs;
          if (globalChatItems && globalChatItems.length > 0) {
            const itemsList = globalChatItems.map(it => `- ${it.sku_name || it.sku_id} (Qty: ${it.quantity})`).join('\n');
            const responseItemsList = globalChatItems.map(it => `- ${it.sku_name || it.sku_id} (Qty: ${it.quantity}, Price: \u20b9${it.unit_price})`).join('\n');
            
            const totalStr = globalQuotation ? `\n\nTotal (Incl. Tax): \u20b9${globalQuotation.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '';
            
            return [
              {
                sender: 'CUSTOMER',
                message: `Hello, please provide a quotation for the following items:\n${itemsList}`,
                timestamp: globalQuotation?.created_at || ''
              },
              {
                sender: 'BOT',
                message: `Dear Customer,\n\nWe have prepared your quotation ${globalComparisonInvoiceId} as requested:\n\n${responseItemsList}${totalStr}\n\nThank you for choosing Trofeo!`,
                timestamp: globalQuotation?.created_at || ''
              }
            ];
          }
          return [];
        };

        const displayLogs = getDisplayLogs();

        return (
          <div className="modal-overlay open">
            <div className="modal-box" style={{ maxWidth: '850px', width: '90%' }}>
              <div className="modal-header" style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  {getChannelIcon(activeSource, 16)} 
                  {activeSource === 'whatsapp' ? 'WhatsApp' : activeSource === 'custom' ? 'Manual' : 'Email'} Transaction Log — {globalComparisonInvoiceId} ({globalComparisonCustName})
                </h3>
                <button className="modal-close" onClick={() => setShowGlobalComparison(false)}>✕</button>
              </div>
              
              <div className="modal-body" style={{ padding: 0 }}>
                {loadingGlobalChat ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '0.5rem', color: '#64748B' }}>
                    <RotateCw className="spin" size={24} style={{ color: '#3B82F6' }} />
                    <span style={{ fontSize: '0.8rem' }}>Loading transaction logs...</span>
                  </div>
                ) : (globalChatLogs.length === 0 && globalChatItems.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748B', fontSize: '0.82rem' }}>
                    No messages logged for this transaction.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem' }}>
                    
                    {/* Left Column: Customer Request */}
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.15rem', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.02em', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {getChannelIcon(activeSource, 12)} Request Received ({activeSource === 'whatsapp' ? 'WhatsApp' : activeSource === 'custom' ? 'Manual' : 'Email'})
                      </h4>
                      <div style={{
                        padding: '0.75rem',
                        background: '#F8FAFC',
                        border: '1px solid #F1F5F9',
                        borderRadius: '8px',
                        fontSize: '0.76rem',
                        color: '#334155',
                        whiteSpace: 'pre-wrap',
                        minHeight: '220px',
                        maxHeight: '280px',
                        overflowY: 'auto',
                        lineHeight: '1.45',
                        fontFamily: 'inherit'
                      }}>
                        {(() => {
                          const customerLogs = displayLogs.filter(log => log.sender?.toUpperCase() === 'CUSTOMER');
                          return customerLogs.length > 0 ? customerLogs[customerLogs.length - 1].message : "No incoming customer message found in logs.";
                        })()}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontStyle: 'italic' }}>
                        {activeSource === 'whatsapp' ? 'Received via WhatsApp channel.' : activeSource === 'custom' ? 'Pasted/Ingested manually via simulator.' : "Parsed from client's mailbox message."}
                      </div>
                    </div>

                    {/* Right Column: AI Response */}
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.15rem', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.78rem', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.02em', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        🤖 Response Sent (Auto-Bot)
                      </h4>
                      <div style={{
                        padding: '0.75rem',
                        background: '#F0FDF4',
                        border: '1px solid #DCFCE7',
                        borderRadius: '8px',
                        fontSize: '0.76rem',
                        color: '#166534',
                        whiteSpace: 'pre-wrap',
                        minHeight: '220px',
                        maxHeight: '280px',
                        overflowY: 'auto',
                        lineHeight: '1.45',
                        fontFamily: 'inherit'
                      }}>
                        {(() => {
                          const botLogs = displayLogs.filter(log => log.sender?.toUpperCase() !== 'CUSTOMER');
                          return botLogs.length > 0 ? botLogs[botLogs.length - 1].message : "No automated response logged.";
                        })()}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        📎 Generated PDF attachment sent to customer.
                      </div>
                    </div>

                  </div>
                )}
              </div>
              
              <div className="modal-footer" style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a
                  href={`/api/quote/pdf/${globalComparisonInvoiceId}?tenant_id=${selectedTenant}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#FFFFFF', background: '#3B82F6', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem' }}
                >
                  📎 View PDF Quotation
                </a>
                <button className="btn btn-ghost" onClick={() => setShowGlobalComparison(false)} style={{ border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', borderRadius: '6px', padding: '0.5rem 1rem' }}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default App;
