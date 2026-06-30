import React, { useState, useEffect } from 'react';
import { MessageSquareText, RotateCw, XCircle, GitPullRequest, Check, Mail, MessageSquare, Sliders } from 'lucide-react';

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

export default function NegotiationsTab({ tenantId, showToast, refreshBadges, invoiceFilter, setInvoiceFilter }) {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Chat Modal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatInvoiceId, setChatInvoiceId] = useState('');
  const [chatCustName, setChatCustName] = useState('');
  const [chatLogs, setChatLogs] = useState([]);
  const [chatItems, setChatItems] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Resolve Modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedCustName, setSelectedCustName] = useState('');
  const [selectedSubtotal, setSelectedSubtotal] = useState(0);
  const [discountInput, setDiscountInput] = useState(10);
  
  // New States for Item Level Discounting
  const [selectedItems, setSelectedItems] = useState([]);
  const [targetSkuId, setTargetSkuId] = useState('');
  const [discountMode, setDiscountMode] = useState('order'); // 'order', 'item_pct', 'item_rate'
  const [itemDiscountValue, setItemDiscountValue] = useState(0);

  const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadNegotiations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/negotiations/escalated?tenant_id=${tenantId}`);
      const data = await res.json();
      setNegotiations(data.negotiations || []);
    } catch (e) {
      showToast('Error loading negotiations: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNegotiations();
  }, [tenantId]);

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
        const data = await res.json();
        const logs = (data.logs || {})[invoiceId] || [];
        const items = (data.items || {})[invoiceId] || [];
        setChatItems(items);
        if (logs.length > 0) {
          setChatLogs(logs);
        } else {
          const detailsRes = await fetch(`/api/quote/details/${invoiceId}?tenant_id=${tenantId}`);
          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            setChatLogs(detailsData.logs || []);
            setChatItems(detailsData.items || []);
          }
        }
      }
    } catch (e) {
      showToast('Error loading chat history: ' + e.message, 'error');
    } finally {
      setLoadingChat(false);
    }
  };

  const openResolveModal = async (invoiceId, custName, subtotal, currentDiscount) => {
    setSelectedInvoiceId(invoiceId);
    setSelectedCustName(custName);
    setSelectedSubtotal(subtotal);
    setDiscountInput(Math.round(currentDiscount * 100));
    setDiscountMode('order');
    setTargetSkuId('');
    setItemDiscountValue(0);
    setSelectedItems([]);
    setShowResolveModal(true);
    
    try {
      const res = await fetch(`/api/quote/details/${invoiceId}?tenant_id=${tenantId}`);
      const data = await res.json();
      if (data.items) {
        setSelectedItems(data.items);
        if (data.items.length > 0) {
          setTargetSkuId(data.items[0].sku_id);
        }
      }
    } catch (e) {
      showToast('Error loading quote items: ' + e.message, 'error');
    }
  };

  const submitResolution = async (action) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/negotiations/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: selectedInvoiceId,
          action,
          override_discount_pct: parseFloat(discountInput) / 100.0,
          tenant_id: tenantId,
          item_discount_mode: discountMode,
          target_sku_id: targetSkuId,
          item_discount_value: parseFloat(itemDiscountValue)
        })
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        const icon = action === 'approve' ? '✅' : action === 'reject' ? '✗' : '↔';
        showToast(`${icon} ${data.message}`, 'success');
      } else {
        showToast(data.message || 'Error occurred.', 'info');
      }
      setShowResolveModal(false);
      loadNegotiations();
      refreshBadges();
    } catch (e) {
      showToast('Error resolving negotiation: ' + e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getPreviewTotals = () => {
    let previewLines = selectedItems.map(item => ({
      ...item,
      previewPrice: item.unit_price
    }));

    let previewDiscountPct = 0;

    if (discountMode === 'order') {
      previewDiscountPct = parseFloat(discountInput || 0) / 100.0;
    } else if (discountMode === 'item_pct') {
      const val = parseFloat(itemDiscountValue || 0);
      const pct = val > 1.0 ? val / 100.0 : val;
      previewLines = previewLines.map(line => {
        if (line.sku_id === targetSkuId) {
          return {
            ...line,
            previewPrice: line.unit_price * (1 - pct)
          };
        }
        return line;
      });
    } else if (discountMode === 'item_rate') {
      const rate = parseFloat(itemDiscountValue || 0);
      previewLines = previewLines.map(line => {
        if (line.sku_id === targetSkuId) {
          return {
            ...line,
            previewPrice: rate
          };
        }
        return line;
      });
    }

    const rawSub = previewLines.reduce((acc, line) => acc + (line.previewPrice * line.quantity), 0);
    const discAmt = rawSub * previewDiscountPct;
    const netSub = rawSub - discAmt;
    const tax = netSub * 0.18;
    const total = netSub + tax;

    return {
      rawSub,
      discAmt,
      netSub,
      tax,
      total,
      previewLines
    };
  };

  return (
    <div className="tab-content active" id="content-negotiations">
      {invoiceFilter && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.75rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
          <span style={{ color: '#1E40AF', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <MessageSquareText size={15} style={{ color: '#3B82F6' }} /> Showing only negotiations for Invoice: <strong>{invoiceFilter}</strong>
          </span>
          <button className="btn btn-sm" onClick={() => setInvoiceFilter('')} style={{ color: '#1E40AF', background: '#FFFFFF', border: '1px solid #BFDBFE', fontSize: '0.75rem', padding: '0.2rem 0.6rem', cursor: 'pointer' }}>
            Show All Negotiations
          </button>
        </div>
      )}

      <div className="section-card" style={{ position: 'relative' }}>
        <div className="section-header">
          <h2><MessageSquareText /> Escalated Negotiations Desk</h2>
          <button className="btn btn-ghost btn-sm" onClick={loadNegotiations} disabled={loading}>
            <RotateCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
        
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Subtotal</th>
                <th>Current Discount</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th>Created</th>
                <th>Chat History</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && negotiations.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">
                      <div className="es-icon"><RotateCw className="spin" /></div>
                      <h3>Loading negotiations…</h3>
                    </div>
                  </td>
                </tr>
              ) : negotiations.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">
                      <div className="es-icon"><MessageSquareText style={{ opacity: 0.35 }} /></div>
                      <h3>No escalated negotiations</h3>
                      <p>All client discounts and quotes are in normal bounds.</p>
                    </div>
                  </td>
                </tr>
              ) : negotiations.filter(n => !invoiceFilter || n.invoice_id === invoiceFilter).length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">
                      <div className="es-icon"><MessageSquareText style={{ opacity: 0.35 }} /></div>
                      <h3>No negotiations match filter</h3>
                      <p>All negotiations for invoice {invoiceFilter} have been resolved.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                negotiations.filter(n => !invoiceFilter || n.invoice_id === invoiceFilter).map(n => {
                  const date = n.created_at ? n.created_at.split(' ')[0] : '—';
                  const disc = n.discount_pct ? Math.round(n.discount_pct * 100) + '%' : '0%';
                  const statusLabel = n.status === 'NEGOTIATION_ESCALATED' 
                    ? <span className="pill red">⬆ Escalated</span> 
                    : <span className="pill yellow">💬 Negotiating</span>;
                  return (
                    <tr key={n.invoice_id}>
                      <td><span className="pill blue">{n.invoice_id}</span></td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{n.customer_name || '—'}</div>
                        <div className="text-sm text-muted">{n.customer_email || ''}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#0F172A' }}>{fmt(n.subtotal)}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Incl: {fmt(n.subtotal * 1.18)}</div>
                      </td>
                      <td><strong style={{ color: '#F59E0B' }}>{disc}</strong></td>
                      <td>
                        <div style={{ fontWeight: '700', color: '#10B981' }}>{fmt(n.grand_total)}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '500' }}>Excl: {fmt(n.subtotal * (1 - (n.discount_pct || 0)))}</div>
                      </td>
                      <td>{statusLabel}</td>
                      <td className="text-sm text-muted">{date}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => openChatHistory(n.invoice_id, n.customer_name || '')}>
                          💬 View Chat
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => openResolveModal(n.invoice_id, n.customer_name || '', n.subtotal, n.discount_pct || 0)}>
                          ⚙️ Resolve
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chat History Modal */}
      {showChatModal && (() => {
        const activeQuote = negotiations.find(n => n.invoice_id === chatInvoiceId);
        const activeSource = activeQuote?.source || 'email';
        
        const getDisplayLogs = () => {
          if (chatLogs && chatLogs.length > 0) return chatLogs;
          if (chatItems && chatItems.length > 0) {
            // Reconstruct fallback logs
            const itemsList = chatItems.map(it => `- ${it.sku_name || it.sku_id} (Qty: ${it.quantity})`).join('\n');
            const responseItemsList = chatItems.map(it => `- ${it.sku_name || it.sku_id} (Qty: ${it.quantity}, Price: ₹${it.unit_price})`).join('\n');
            
            const totalStr = activeQuote ? `\n\nTotal (Incl. Tax): ₹${activeQuote.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '';
            
            return [
              {
                sender: 'CUSTOMER',
                message: `Hello, please provide a quotation for the following items:\n${itemsList}`,
                timestamp: activeQuote?.created_at || ''
              },
              {
                sender: 'BOT',
                message: `Dear Customer,\n\nWe have prepared your quotation ${chatInvoiceId} as requested:\n\n${responseItemsList}${totalStr}\n\nThank you for choosing Trofeo!`,
                timestamp: activeQuote?.created_at || ''
              }
            ];
          }
          return [];
        };

        const displayLogs = getDisplayLogs();

        return (
          <div className="modal-overlay open">
            <div className="modal-box" style={{ maxWidth: '620px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem', fontWeight: '700', color: '#0F172A' }}>
                  {getChannelIcon(activeSource, 16)}
                  {activeSource === 'whatsapp' ? 'WhatsApp' : activeSource === 'custom' ? 'Manual' : 'Email'} Chat History — {chatInvoiceId} ({chatCustName})
                </h3>
                <button className="modal-close" onClick={() => setShowChatModal(false)}>✕</button>
              </div>
              <div className="modal-body" style={{ padding: 0 }}>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '450px', overflowY: 'auto' }}>
                  {loadingChat ? (
                    <div className="empty-state"><h3>Loading chat history…</h3></div>
                  ) : displayLogs.length === 0 ? (
                    <div className="empty-state"><h3>No messages logged</h3></div>
                  ) : (
                    displayLogs.map((log, i) => {
                      const isUser = log.sender?.toUpperCase() === 'CUSTOMER';
                      return (
                        <div key={i} className={`chat-bubble ${isUser ? 'customer' : 'ai'}`}>
                          <div className="bubble-sender">{isUser ? 'Customer' : 'AI Copilot'}</div>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{log.message}</div>
                          <div className="bubble-time">{log.timestamp ? log.timestamp.split(' ')[1] : ''}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowChatModal(false)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="modal-overlay open">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Resolve Price Negotiation</h3>
              <button className="modal-close" onClick={() => setShowResolveModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="deficit-meta">
                <div className="meta-row"><span>Invoice ID</span><span><code>{selectedInvoiceId}</code></span></div>
                <div className="meta-row"><span>Customer</span><span>{selectedCustName}</span></div>
                <div className="meta-row"><span>Subtotal (Standard)</span><span>{fmt(selectedSubtotal)}</span></div>
              </div>
              <hr className="divider" />
              <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>Choose an override action. The customer will receive an updated quotation PDF email immediately.</p>
              
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: '600' }}>Discount Application Type</label>
                <div className="toggle-row" style={{ display: 'flex', gap: '0.5rem', background: '#F1F5F9', padding: '0.25rem', borderRadius: '8px' }}>
                  <button 
                    className={`toggle-opt ${discountMode === 'order' ? 'active' : ''}`}
                    onClick={() => setDiscountMode('order')}
                    type="button"
                    style={{ flex: 1, padding: '0.4rem', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', background: discountMode === 'order' ? '#FFFFFF' : 'transparent', boxShadow: discountMode === 'order' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontWeight: discountMode === 'order' ? '600' : '400' }}
                  >
                    Entire Order
                  </button>
                  <button 
                    className={`toggle-opt ${discountMode === 'item_pct' ? 'active' : ''}`}
                    onClick={() => setDiscountMode('item_pct')}
                    type="button"
                    style={{ flex: 1, padding: '0.4rem', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', background: discountMode === 'item_pct' ? '#FFFFFF' : 'transparent', boxShadow: discountMode === 'item_pct' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontWeight: discountMode === 'item_pct' ? '600' : '400' }}
                  >
                    Specific Item %
                  </button>
                  <button 
                    className={`toggle-opt ${discountMode === 'item_rate' ? 'active' : ''}`}
                    onClick={() => setDiscountMode('item_rate')}
                    type="button"
                    style={{ flex: 1, padding: '0.4rem', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', background: discountMode === 'item_rate' ? '#FFFFFF' : 'transparent', boxShadow: discountMode === 'item_rate' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontWeight: discountMode === 'item_rate' ? '600' : '400' }}
                  >
                    Override Item Rate
                  </button>
                </div>
              </div>

              {discountMode === 'order' && (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Order Discount Percentage (%)</label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={discountInput}
                      onChange={e => setDiscountInput(e.target.value)}
                      className="form-control"
                      style={{ maxWidth: '100px', padding: '0.4rem 0.6rem', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                      min="0" max="50" step="0.5"
                    />
                    <span className="text-muted text-sm">Set 0 to use standard pricing</span>
                  </div>
                </div>
              )}

              {discountMode === 'item_pct' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>Select Target Product</label>
                    <select 
                      className="form-control" 
                      value={targetSkuId} 
                      onChange={e => setTargetSkuId(e.target.value)}
                      style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    >
                      {selectedItems.map(item => (
                        <option key={item.sku_id} value={item.sku_id}>
                          {item.sku_name} ({item.sku_id}) — Price: {fmt(item.unit_price)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>Item Discount Percentage (%)</label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={itemDiscountValue}
                        onChange={e => setItemDiscountValue(e.target.value)}
                        className="form-control"
                        style={{ maxWidth: '100px', padding: '0.4rem 0.6rem', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                        min="0" max="90" step="1"
                      />
                      <span className="text-muted text-sm">Percent off on this SKU (e.g. 15)</span>
                    </div>
                  </div>
                </div>
              )}

              {discountMode === 'item_rate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>Select Target Product</label>
                    <select 
                      className="form-control" 
                      value={targetSkuId} 
                      onChange={e => setTargetSkuId(e.target.value)}
                      style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    >
                      {selectedItems.map(item => (
                        <option key={item.sku_id} value={item.sku_id}>
                          {item.sku_name} ({item.sku_id}) — Original: {fmt(item.unit_price)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>New Unit Price / Rate (₹)</label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={itemDiscountValue}
                        onChange={e => setItemDiscountValue(e.target.value)}
                        className="form-control"
                        style={{ maxWidth: '100px', padding: '0.4rem 0.6rem', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                        min="0" step="0.5"
                      />
                      <span className="text-muted text-sm">Enter direct price rate (e.g. 85)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Calculation Preview Card */}
              {selectedItems.length > 0 && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginTop: '1.25rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                    📊 Live Calculation Preview
                  </span>
                  
                  {/* Item price changes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem', borderBottom: '1px dashed #E2E8F0', paddingBottom: '0.6rem' }}>
                    {getPreviewTotals().previewLines.map(line => {
                      const hasChanged = line.previewPrice !== line.unit_price;
                      return (
                        <div key={line.sku_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#475569' }}>
                          <span>{line.sku_name} (x{line.quantity})</span>
                          <span>
                            {hasChanged && <span style={{ textDecoration: 'line-through', color: '#94A3B8', marginRight: '0.4rem' }}>{fmt(line.unit_price)}</span>}
                            <strong style={{ color: hasChanged ? '#10B981' : '#475569' }}>{fmt(line.previewPrice)}</strong>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Financial Breakdown */}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal (Excl. Tax):</span>
                      <strong>{fmt(getPreviewTotals().rawSub)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>Subtotal (Incl. Tax):</span>
                      <span>{fmt(getPreviewTotals().rawSub * 1.18)}</span>
                    </div>
                    {getPreviewTotals().discAmt > 0 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                          <span>Discount (Excl. Tax):</span>
                          <strong>-{fmt(getPreviewTotals().discAmt)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                          <span>Net Amount (Excl. Tax):</span>
                          <strong>{fmt(getPreviewTotals().netSub)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                          <span>Net Amount (Incl. Tax):</span>
                          <span>{fmt(getPreviewTotals().netSub * 1.18)}</span>
                        </div>
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>GST (18%):</span>
                      <span>{fmt(getPreviewTotals().tax)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #CBD5E1', paddingTop: '0.35rem', marginTop: '0.2rem', fontSize: '0.86rem', fontWeight: '700', color: '#0F172A' }}>
                      <span>Grand Total (Incl. Tax):</span>
                      <span style={{ color: '#2563EB' }}>{fmt(getPreviewTotals().total)}</span>
                    </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={() => setShowResolveModal(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={() => submitResolution('reject')} disabled={submitting}>
                <XCircle size={12} /> Reject Request
              </button>
              <button className="btn btn-warning btn-sm" onClick={() => submitResolution('counter')} disabled={submitting}>
                <GitPullRequest size={12} /> Counter Offer
              </button>
              <button className="btn btn-success btn-sm" onClick={() => submitResolution('approve')} disabled={submitting}>
                <Check size={12} /> Approve Discount
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
