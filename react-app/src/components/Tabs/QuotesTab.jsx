import React, { useState, useEffect } from 'react';
import { FolderOpen, RotateCw, Calendar, User, FileText, AlertTriangle, CheckCircle2, Mail, MessageSquare, Sliders } from 'lucide-react';

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

export default function QuotesTab({ tenantId, showToast, openInventoryModal, invoiceFilter, setInvoiceFilter }) {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lowStockData, setLowStockData] = useState([]);

  // Chat History Modal State
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatInvoiceId, setChatInvoiceId] = useState('');
  const [chatCustName, setChatCustName] = useState('');
  const [chatLogs, setChatLogs] = useState([]);
  const [chatItems, setChatItems] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [autoOpenedId, setAutoOpenedId] = useState('');

  const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report/data?tenant_id=${tenantId}`);
      const data = await res.json();
      const allQuotes = data.quotations || [];
      setQuotes(allQuotes);
      const query = invoiceFilter || searchQuery;
      filterQuotes(query, allQuotes);
    } catch (e) {
      showToast('Error loading quotations: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLowStock = async () => {
    try {
      const res = await fetch(`/api/inventory/low-stock?tenant_id=${tenantId}&threshold=5`);
      const data = await res.json();
      setLowStockData(data.items || []);
    } catch (e) { /* silently ignore */ }
  };

  useEffect(() => {
    loadQuotes();
    loadLowStock();
  }, [tenantId]);

  useEffect(() => {
    if (invoiceFilter) {
      setSearchQuery(invoiceFilter);
      filterQuotes(invoiceFilter, quotes);
      
      // Auto-open comparison modal for the filtered quote directly
      if (quotes.length > 0 && autoOpenedId !== invoiceFilter) {
        const matchingQuote = quotes.find(q => q.invoice_id.toLowerCase().trim() === invoiceFilter.toLowerCase().trim());
        if (matchingQuote) {
          setAutoOpenedId(invoiceFilter);
          openChatHistory(matchingQuote.invoice_id, matchingQuote.customer_name || '');
        }
      }
    } else {
      setAutoOpenedId('');
    }
  }, [invoiceFilter, quotes, autoOpenedId]);

  const filterQuotes = (query, list = quotes) => {
    const q = query.toLowerCase().trim();
    if (!q) {
      setFilteredQuotes(list);
      return;
    }
    const filtered = list.filter(qt =>
      (qt.invoice_id || '').toLowerCase().includes(q) ||
      (qt.customer_name || '').toLowerCase().includes(q) ||
      (qt.customer_email || '').toLowerCase().includes(q)
    );
    setFilteredQuotes(filtered);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    filterQuotes(val);
    if (setInvoiceFilter) {
      setInvoiceFilter('');
    }
  };

  const openChatHistory = async (invoiceId, custName) => {
    setChatInvoiceId(invoiceId);
    setChatCustName(custName);
    setShowChatModal(true);
    setLoadingChat(true);
    setChatLogs([]);
    setChatItems([]);
    try {
      const res = await fetch(`/api/report/data?tenant_id=${tenantId}`);
      if (res.ok) {
        const json = await res.json();
        const logsFromReport = (json.logs || {})[invoiceId] || [];
        const itemsFromReport = (json.items || {})[invoiceId] || [];
        setChatItems(itemsFromReport);
        if (logsFromReport.length > 0) {
          setChatLogs(logsFromReport);
        } else {
          const detailsRes = await fetch(`/api/quote/details/${invoiceId}?tenant_id=${tenantId}`);
          if (detailsRes.ok) {
            const detailsJson = await detailsRes.json();
            setChatLogs(detailsJson.logs || []);
            setChatItems(detailsJson.items || []);
          }
        }
      }
    } catch (e) {
      showToast('Error loading chat history: ' + e.message, 'error');
    } finally {
      setLoadingChat(false);
    }
  };

  const statusMap = {
    'QUOTE_GENERATED': { cls: 'generated', label: 'Quote Sent', pillClass: 'pill blue' },
    'QUOTE_UPDATED': { cls: 'generated', label: 'Updated', pillClass: 'pill blue' },
    'NEGOTIATION_ESCALATED': { cls: 'escalated', label: 'Escalated', pillClass: 'pill red' },
    'NEGOTIATION_NEGOTIATING': { cls: 'escalated', label: 'Negotiating', pillClass: 'pill yellow' },
    'NEGOTIATION_APPROVED': { cls: 'approved', label: 'Approved', pillClass: 'pill green' },
    'NEGOTIATION_REJECTED': { cls: 'rejected', label: 'Rejected', pillClass: 'pill gray' },
  };

  return (
    <div className="tab-content active" id="content-quotes">
      

      {/* Quote grid repository */}
      <div className="section-card" style={{ position: 'relative' }}>
        <div className="section-header">
          <h2><FolderOpen /> Quotation Repository</h2>
          <div className="gap-row">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="form-control"
                style={{ width: '240px', padding: '0.45rem 2rem 0.45rem 1rem', fontSize: '0.8rem' }}
                placeholder="Search by customer or invoice…"
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); filterQuotes(''); if (setInvoiceFilter) setInvoiceFilter(''); }}
                  style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.2rem', fontSize: '0.8rem' }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={loadQuotes} disabled={loading}>
              <RotateCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="section-body">
          {loading && quotes.length === 0 ? (
            <div className="empty-state">
              <div className="es-icon"><RotateCw className="spin" /></div>
              <h3>Loading quotes…</h3>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="es-icon"><FolderOpen style={{ opacity: 0.35 }} /></div>
              <h3>No quotes found</h3>
              <p>Process an order from the simulator to generate the first quotation.</p>
            </div>
          ) : (
            <div className="quote-grid">
              {filteredQuotes.map(q => {
                const sm = statusMap[q.status] || { cls: 'generated', label: q.status, pillClass: 'pill gray' };
                const date = q.created_at ? q.created_at.split(' ')[0] : '—';
                const hasDiscount = q.discount_pct > 0;
                
                return (
                  <div key={q.invoice_id} className={`quote-card ${sm.cls}`} onClick={() => openChatHistory(q.invoice_id, q.customer_name || '')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <h3>{q.invoice_id}</h3>
                      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        {renderChannelBadge(q.source)}
                        <span className={sm.pillClass}>{sm.label}</span>
                      </div>
                    </div>
                    <div className="qc-customer">
                      <User size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> 
                      {q.customer_name || '—'} &nbsp;·&nbsp; {q.customer_email || ''}
                    </div>
                    <div className="qc-total" style={{ fontSize: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                      <div style={{ color: '#10B981', fontWeight: '700' }}>Incl: {fmt(q.grand_total)}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '500' }}>Excl: {fmt(q.subtotal * (1 - (q.discount_pct || 0)))}</div>
                    </div>
                    <div className="qc-footer">
                      <span className="qc-date">
                        <Calendar size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> 
                        {date}
                      </span>
                      {hasDiscount && (
                        <span className="pill yellow">{Math.round(q.discount_pct * 100)}% off</span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <a
                        href={`/api/quote/pdf/${q.invoice_id}?tenant_id=${tenantId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                        style={{ border: '1px solid #E2E8F0', padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FFFFFF' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <FileText size={11} /> 
                        View PDF
                      </a>
                      
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ border: '1px solid #E2E8F0', padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FFFFFF', color: '#3B82F6' }}
                        onClick={(e) => { e.stopPropagation(); openChatHistory(q.invoice_id, q.customer_name || ''); }}
                      >
                        {getChannelIcon(q.source, 11)} View Request
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat History Modal (Redesigned as Side-by-Side Comparison Modal) */}
      {showChatModal && (() => {
        const activeQuote = quotes.find(q => q.invoice_id === chatInvoiceId);
        const activeSource = activeQuote?.source || 'email';
        
        return (
          <div className="modal-overlay open">
            <div className="modal-box" style={{ maxWidth: '850px', width: '90%' }}>
              <div className="modal-header" style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {getChannelIcon(activeSource, 16)} 
                  {activeSource === 'whatsapp' ? 'WhatsApp' : activeSource === 'custom' ? 'Manual' : 'Email'} Transaction Log — {chatInvoiceId} ({chatCustName})
                </h3>
                <button className="modal-close" onClick={() => setShowChatModal(false)}>✕</button>
              </div>
              
              <div className="modal-body" style={{ padding: 0 }}>
                {loadingChat ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '0.5rem', color: '#64748B' }}>
                    <RotateCw className="spin" size={24} style={{ color: '#3B82F6' }} />
                    <span style={{ fontSize: '0.8rem' }}>Loading transaction email logs...</span>
                  </div>
                ) : (chatLogs.length === 0 && chatItems.length === 0) ? (
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
                          const customerLogs = chatLogs.filter(log => log.sender?.toLowerCase() === 'customer');
                          if (customerLogs.length > 0) {
                            return customerLogs[customerLogs.length - 1].message;
                          }
                          if (chatItems && chatItems.length > 0) {
                            const itemsList = chatItems.map(it => `- ${it.sku_name || it.sku_id} (Qty: ${it.quantity})`).join('\n');
                            return `Hello, please provide a quotation for the following items:\n${itemsList}`;
                          }
                          return "No incoming customer message found in logs.";
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
                          const botLogs = chatLogs.filter(log => log.sender?.toLowerCase() !== 'customer');
                          if (botLogs.length > 0) {
                            return botLogs[botLogs.length - 1].message;
                          }
                          if (chatItems && chatItems.length > 0) {
                            const itemsList = chatItems.map(it => `- ${it.sku_name || it.sku_id} (Qty: ${it.quantity}, Price: ₹${it.unit_price})`).join('\n');
                            const totalStr = activeQuote ? `\n\nTotal (Incl. Tax): ₹${activeQuote.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '';
                            return `Dear Customer,\n\nWe have prepared your quotation ${chatInvoiceId} as requested:\n\n${itemsList}${totalStr}\n\nThank you for choosing Trofeo!`;
                          }
                          return "No automated response logged.";
                        })()}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        📎 Generated PDF attachment sent to customer.
                      </div>
                    </div>

                  </div>
                )}
              </div>
              
              <div className="modal-footer" style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a
                  href={`/api/quote/pdf/${chatInvoiceId}?tenant_id=${tenantId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  📎 View PDF Quotation
                </a>
                <button className="btn btn-ghost" onClick={() => setShowChatModal(false)} style={{ border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem' }}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
