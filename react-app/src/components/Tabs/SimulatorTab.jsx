import React, { useState, useEffect, useRef } from 'react';
import { Play, TrendingUp, MessageSquare, FileText, Search, User, Calendar, Table, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function SimulatorTab({ tenantId, showToast, refreshBadges, invoiceFilter, setInvoiceFilter }) {
  const [inputText, setInputText] = useState('');
  const [engine, setEngine] = useState('A');
  const [custEmail, setCustEmail] = useState('rajarajanodooimplementers@gmail.com');
  const [inputType, setInputType] = useState('email');

  useEffect(() => {
    if (invoiceFilter && invoiceFilter.includes('@')) {
      setCustEmail(invoiceFilter);
      if (setInvoiceFilter) {
        setInvoiceFilter('');
      }
    }
  }, [invoiceFilter]);
  
  // Simulation results state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [matchedLines, setMatchedLines] = useState([]);
  const [discountPct, setDiscountPct] = useState(0.0);
  const [customerName, setCustomerName] = useState('Walk-in Retail Client');
  const [invoiceId, setInvoiceId] = useState('');
  
  // HITL state
  const [showHitl, setShowHitl] = useState(false);
  const [hitlIndex, setHitlIndex] = useState(null);
  const [hitlOptions, setHitlOptions] = useState([]);

  // Negotiation Panel State
  const [showNegPanel, setShowNegPanel] = useState(false);
  const [targetDiscount, setTargetDiscount] = useState(10);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [negLoading, setNegLoading] = useState(false);
  const [negStatus, setNegStatus] = useState('Active');
  
  const chatEndRef = useRef(null);

  const presets = [
    {
      label: '📧 Email with Deficits',
      text: `Subject: Quotation Request - Order SKU-2026-X\nDear Sales Team,\nPlease send pricing and quotes for the following parts:\n1. 10 units of Plastic Tool Box 19 Inch\n2. 5 units of Heavy Duty Staple Tacker Gun\n3. 2 units of Spirit Level Aluminum 24 Inch\nThanks,\nRajarajan (rajarajanodooimplementers@gmail.com)`
    },
    {
      label: '💬 WhatsApp Shorthand',
      text: `Hi, need stock check and discount for:\n- 3 qty box-tool-19\n- 8 qty staple gun\nUrgently need delivery to our site tomorrow. Let me know the total with tax.`
    },
    {
      label: '⚠️ Deficit Trigger (High Qty)',
      text: `Order inquiry:\n- 15 units of Plastic Tool Box 19 Inch (BOX-TOOL-19)\nNeed invoice asap.`
    }
  ];

  // Helper formatter
  const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const runPipeline = async () => {
    if (!inputText.trim()) {
      showToast('Please enter enquiry text first.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          engine,
          customer_email: custEmail,
          input_type: inputType,
          tenant_id: tenantId
        })
      });
      const data = await res.json();
      setResults(data.metrics);
      setMatchedLines(data.matched_lines || []);
      setDiscountPct(data.discount_pct || 0.0);
      setCustomerName(data.customer_name || 'Walk-in Retail Client');
      
      // Generate random invoice ID
      setInvoiceId('TRF-' + Math.floor(100000 + Math.random() * 900000));
      
      // Reset negotiation panel
      setShowNegPanel(false);
      setChatHistory([]);
      
      showToast('Pipeline executed successfully!', 'success');
    } catch (e) {
      showToast('Execution error: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openHitlModal = (index, line) => {
    setHitlIndex(index);
    setHitlOptions(line.alternatives || []);
    setShowHitl(true);
  };

  const selectHitlOverride = async (skuId) => {
    if (hitlIndex === null) return;
    const targetLine = matchedLines[hitlIndex];
    try {
      const res = await fetch('/api/hitl/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: targetLine.query_text,
          sku_id: skuId,
          tenant_id: tenantId
        })
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        showToast('HITL override registered as synonym!', 'success');
        // Update local line details
        const updated = [...matchedLines];
        const selectedOpt = hitlOptions.find(o => o.sku_id === skuId);
        updated[hitlIndex] = {
          ...targetLine,
          matched_sku_id: skuId,
          matched_sku_name: selectedOpt.sku_name,
          confidence: 100,
          unit_price: selectedOpt.price,
          stock_avail: selectedOpt.stock
        };
        setMatchedLines(updated);
        setShowHitl(false);
      }
    } catch (err) {
      showToast('Override failed: ' + err.message, 'error');
    }
  };

  const generatePdf = async () => {
    if (!matchedLines.length) return;
    try {
      const res = await fetch('/api/quote/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matched_lines: matchedLines,
          discount_pct: discountPct,
          customer_name: customerName,
          invoice_id: invoiceId,
          tenant_id: tenantId,
          source: inputType,
          original_text: inputText
        })
      });
      const data = await res.json();
      if (data.pdf_url) {
        showToast('Quotation PDF generated successfully!', 'success');
        window.open(data.pdf_url, '_blank');
        refreshBadges();
      }
    } catch (e) {
      showToast('Error generating PDF: ' + e.message, 'error');
    }
  };

  const sendNegMsg = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    const updatedHistory = [...chatHistory, { role: 'user', message: userMsg }];
    setChatHistory(updatedHistory);
    setChatInput('');
    setNegLoading(true);

    try {
      const res = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_message: userMsg,
          requested_discount: parseFloat(targetDiscount) / 100.0,
          chat_history: updatedHistory,
          tenant_id: tenantId
        })
      });
      const data = await res.json();
      setChatHistory([...updatedHistory, { role: 'assistant', message: data.reply }]);
      setNegStatus(data.status);
      if (data.recommended_discount !== undefined) {
        setDiscountPct(data.recommended_discount);
      }
    } catch (e) {
      showToast('Negotiation failed: ' + e.message, 'error');
    } finally {
      setNegLoading(false);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Totals calculations
  const rawSub = matchedLines.reduce((acc, l) => acc + (l.matched_sku_id !== 'UNKNOWN' ? (l.unit_price || 0) * (l.quantity || 0) : 0), 0);
  const discountAmt = rawSub * discountPct;
  const netSub = rawSub - discountAmt;
  const gst = netSub * 0.18;
  const grandTotal = netSub + gst;

  // Render QR Canvas code
  useEffect(() => {
    if (results) {
      const canvas = document.getElementById('qrCanvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = 110; canvas.height = 110;
        ctx.fillStyle = '#1a2340';
        ctx.fillRect(0, 0, 110, 110);
        ctx.fillStyle = '#6366F1';
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText("PAY VIA UPI", 55, 45);
        ctx.fillText(fmt(grandTotal), 55, 65);
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 3;
        ctx.strokeRect(6, 6, 98, 98);
      }
    }
  }, [results, grandTotal]);

  // Analytics mock datasets
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Enquiries Received',
      data: [12, 18, 15, 25, 22, 32, 28],
      borderColor: '#0052CC',
      backgroundColor: 'rgba(0, 82, 204, 0.04)',
      fill: true,
      tension: 0.4,
      borderWidth: 2.5
    }, {
      label: 'Successful Matches %',
      data: [85, 90, 88, 95, 92, 98, 96],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.04)',
      fill: true,
      tension: 0.4,
      borderWidth: 2.5
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { family: 'Plus Jakarta Sans', weight: 600, size: 10 },
          color: '#475569',
          boxWidth: 10,
          padding: 12
        }
      }
    },
    scales: {
      y: {
        grid: { color: '#F1F5F9', drawBorder: false },
        ticks: { color: '#475569', font: { family: 'Plus Jakarta Sans', size: 9 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#475569', font: { family: 'Plus Jakarta Sans', size: 9 } }
      }
    }
  };

  const lowConf = matchedLines.some(l => l.confidence < 80 && l.matched_sku_id !== 'UNKNOWN');

  return (
    <div className="tab-content active" id="content-simulator">
      <div className="sim-layout">
        
        {/* LEFT COLUMN: INPUT */}
        <div className="section-card" style={{ position: 'relative' }}>
          <div className="section-header">
            <h2>Enquiry Ingestion</h2>
          </div>
          <div className="section-body">
            <div className="form-group">
              <label className="form-label">Order Enquiry Text</label>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="form-control"
                placeholder="Paste customer enquiry email or WhatsApp message here…"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Customer Email Address</label>
              <input
                type="email"
                value={custEmail}
                onChange={e => setCustEmail(e.target.value)}
                className="form-control"
                placeholder="customer@email.com"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Input Channel Source</label>
              <div className="toggle-row">
                {['email', 'whatsapp', 'custom'].map(type => (
                  <button
                    key={type}
                    className={`toggle-opt ${inputType === type ? 'active' : ''}`}
                    onClick={() => setInputType(type)}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Matching Algorithm Engine</label>
              <div className="toggle-row">
                <button className={`toggle-opt ${engine === 'A' ? 'active' : ''}`} onClick={() => setEngine('A')}>
                  Engine A (Fuzzy)
                </button>
                <button className={`toggle-opt ${engine === 'B' ? 'active' : ''}`} onClick={() => setEngine('B')}>
                  Engine B (Hybrid AI)
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="form-label">Quick Presets</label>
              <div className="preset-row">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    className="btn-preset"
                    onClick={() => {
                      setInputText(p.text);
                      if (idx === 1) setInputType('whatsapp');
                      else setInputType('email');
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <hr className="divider" />
            
            <button
              onClick={runPipeline}
              disabled={loading}
              className="btn btn-primary btn-full btn-lg"
            >
              {loading ? <div className="spinner"></div> : <Play size={16} />} 
              {loading ? 'Processing Order...' : 'Ingest & Match Order'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: RESULTS */}
        <div className="results-box">
          
          {/* KPI Row */}
          <div className="metrics-row">
            <div className="kpi-card blue">
              <div className="kpi-icon"><TrendingUp /></div>
              <div className="kpi-content">
                <span>Items Parsed</span>
                <strong>{results ? results.parsed_count : '—'}</strong>
              </div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-icon"><Table /></div>
              <div className="kpi-content">
                <span>Match Rate</span>
                <strong>{results && matchedLines.length ? `${Math.round((matchedLines.filter(l => l.matched_sku_id !== 'UNKNOWN').length / matchedLines.length) * 100)}%` : '—'}</strong>
              </div>
            </div>
            <div className="kpi-card purple">
              <div className="kpi-icon"><TrendingUp /></div>
              <div className="kpi-content">
                <span>Search Time</span>
                <strong>{results ? `${results.search_time_sec}s` : '—'}</strong>
              </div>
            </div>
            <div className="kpi-card yellow">
              <div className="kpi-icon"><HelpCircle /></div>
              <div className="kpi-content">
                <span>API Cost</span>
                <strong>{results ? `$${results.cost_usd}` : '—'}</strong>
              </div>
            </div>
          </div>

          {/* Chart Overview */}
          <div className="section-card" style={{ padding: '1.5rem 1.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp style={{ color: 'var(--accent-blue)' }} /> Trade Analytics Overview
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, background: 'rgba(0,82,204,0.08)', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
                Live Updates
              </span>
            </div>
            <div style={{ position: 'relative', height: '180px', width: '100%' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* HITL warning */}
          {lowConf && (
            <div className="hitl-warn visible">
              <p>⚠️ Low-confidence matches detected (&lt;80%). Human review recommended.</p>
              <button className="btn btn-warning btn-sm" onClick={() => {
                const idx = matchedLines.findIndex(l => l.confidence < 80 && l.matched_sku_id !== 'UNKNOWN');
                if (idx !== -1) openHitlModal(idx, matchedLines[idx]);
              }}>Review</button>
            </div>
          )}

          {/* Results Table */}
          {results && (
            <div className="section-card">
              <div className="section-header">
                <h2><Table /> Match Results Matrix</h2>
                <div className="gap-row" style={{ display: 'flex' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowNegPanel(!showNegPanel)}>
                    <MessageSquare size={14} /> Negotiate
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={generatePdf}>
                    <FileText size={14} /> Generate Quote PDF
                  </button>
                </div>
              </div>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer Line</th>
                      <th>Matched SKU</th>
                      <th>Qty</th>
                      <th>Confidence</th>
                      <th>Stock</th>
                      <th>Unit Price</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchedLines.map((line, idx) => {
                      const isUnmatched = line.matched_sku_id === 'UNKNOWN';
                      const confClass = line.confidence >= 80 ? 'high' : line.confidence >= 50 ? 'mid' : 'low';
                      
                      let stockPill = <span className="pill green">In Stock</span>;
                      if (isUnmatched) stockPill = <span className="pill gray">N/A</span>;
                      else if ((line.quantity || 0) === 0) stockPill = <span className="pill red">Out of Stock</span>;
                      else if (line.stock_avail !== undefined && line.stock_avail <= 5) stockPill = <span className="pill yellow">Low ({line.stock_avail})</span>;

                      return (
                        <tr key={idx}>
                          <td title={line.original_line}>{line.original_line.length > 32 ? line.original_line.substr(0,29)+'…' : line.original_line}</td>
                          <td>
                            {isUnmatched ? (
                              <span className="pill red">No match</span>
                            ) : (
                              <>
                                <strong>{line.matched_sku_name}</strong>
                                <br />
                                <span className="text-sm text-muted">{line.matched_sku_id}</span>
                              </>
                            )}
                          </td>
                          <td>{line.quantity || 0}</td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>{line.confidence}%</div>
                            <div className="conf-bar">
                              <div className={`conf-fill ${confClass}`} style={{ width: `${line.confidence}%` }}></div>
                            </div>
                            {line.confidence < 80 && !isUnmatched && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ marginTop: '0.4rem', fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                                onClick={() => openHitlModal(idx, line)}
                              >
                                Match
                              </button>
                            )}
                          </td>
                          <td>{stockPill}</td>
                          <td>{fmt(line.unit_price)}</td>
                          <td><strong>{fmt((line.unit_price || 0) * (line.quantity || 0))}</strong></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Invoice Calculations Panel */}
              <div className="section-body" id="invoiceSection">
                <div className="invoice-layout">
                  <div className="invoice-box">
                    <div className="inv-row"><span>Raw Subtotal:</span><span>{fmt(rawSub)}</span></div>
                    {discountPct > 0 && (
                      <>
                        <div className="inv-row"><span>CRM Discount ({Math.round(discountPct*100)}%):</span><span>−{fmt(discountAmt)}</span></div>
                        <div className="inv-row" style={{ fontWeight: 600 }}><span>Net Subtotal:</span><span>{fmt(netSub)}</span></div>
                      </>
                    )}
                    <div className="inv-row"><span>GST (18%):</span><span>{fmt(gst)}</span></div>
                    <div className="inv-row grand"><span>Grand Total:</span><span>{fmt(grandTotal)}</span></div>
                  </div>
                  <div className="qr-box">
                    <div className="qr-bg"><canvas id="qrCanvas"></canvas></div>
                    <p className="text-sm text-muted" style={{ textAlign: 'center' }}><strong>UPI Payment QR</strong><br />Scan to pay balance</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Negotiation panel */}
          {showNegPanel && (
            <div className="section-card neg-panel visible" id="negotiationPanel">
              <div className="section-header">
                <h2><MessageSquare /> AI Negotiation Chat</h2>
                <span className={`pill ${negStatus === 'Active' ? 'blue' : 'green'}`}>{negStatus}</span>
              </div>
              <div className="section-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', marginBottom: 0 }}>
                  <label className="form-label" style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>Target Discount (%)</label>
                  <input
                    type="number"
                    value={targetDiscount}
                    onChange={e => setTargetDiscount(e.target.value)}
                    min="1" max="50" className="form-control" style={{ width: '90px' }}
                  />
                </div>
                
                <div className="chat-wrap" id="chatBox">
                  {chatHistory.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem' }}><p className="text-muted">Start negotiating by typing a message below.</p></div>
                  ) : (
                    chatHistory.map((msg, i) => (
                      <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'customer' : 'ai'}`}>
                        <div className="bubble-sender">{msg.role === 'user' ? 'Customer' : 'AI Copilot'}</div>
                        <div>{msg.message}</div>
                      </div>
                    ))
                  )}
                  {negLoading && <div className="chat-bubble ai"><div className="spinner" style={{ borderColor: '#6366F1' }}></div> Thinking...</div>}
                  <div ref={chatEndRef} />
                </div>
                
                <div className="chat-send-row">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyPress={e => { if (e.key === 'Enter') sendNegMsg(); }}
                    className="chat-send-input"
                    placeholder="Write your counter offer or explain why…"
                  />
                  <button className="btn btn-primary" onClick={sendNegMsg}>Send</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* HITL Override Modal */}
      {showHitl && (
        <div className="modal-overlay open">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Review Match</h3>
              <button className="modal-close" onClick={() => setShowHitl(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
                Select the correct SKU to register as a synonym for <code>"{matchedLines[hitlIndex]?.query_text}"</code>.
              </p>
              <div>
                {hitlOptions.map((opt, oIdx) => (
                  <div key={oIdx} className="match-option" onClick={() => selectHitlOverride(opt.sku_id)}>
                    <div>
                      <div className="mo-name">{opt.sku_name}</div>
                      <div className="mo-id">{opt.sku_id} · {opt.category}</div>
                    </div>
                    <div className="mo-score">{opt.score ? `${opt.score}% match` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowHitl(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
