import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, UserCheck, Activity, RotateCw, AlertTriangle, MessageSquare, ArrowRight, CornerDownRight, ExternalLink, Sliders } from 'lucide-react';

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

export default function OverviewTab({ tenantId, showToast, setActiveTab, navigateToTab, openQuoteComparison }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // New States for Command Center
  const [serviceStatus, setServiceStatus] = useState({ status: 'UNKNOWN', last_seen: null, error_message: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewDetails, setPreviewDetails] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // default to kanban board on load
  const [chartTab, setChartTab] = useState('new'); // 'new', 'responded', 'pending', 'total'

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/overview/analytics?tenant_id=${tenantId}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      showToast('Error loading overview analytics: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadServiceStatus = async () => {
    try {
      const res = await fetch(`/api/service/status?tenant_id=${tenantId}`);
      if (res.ok) {
        const json = await res.json();
        if (json) {
          setServiceStatus(json);
        }
      }
    } catch (e) {
      console.error('Failed to load service status', e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/service/logs?tenant_id=${tenantId}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (e) {
      console.error('Failed to fetch service logs', e);
    }
  };

  const handleCardClick = async (invoiceId) => {
    if (!invoiceId) return;
    setDrawerLoading(true);
    setPreviewItem({ type: 'quote', invoiceId });
    setPreviewDetails(null);
    setDrawerOpen(true);
    try {
      const res = await fetch(`/api/quote/details/${invoiceId}?tenant_id=${tenantId}`);
      if (res.ok) {
        const json = await res.json();
        setPreviewDetails(json);
      } else {
        showToast('Failed to fetch quotation details', 'error');
      }
    } catch (e) {
      showToast('Error fetching details: ' + e.message, 'error');
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleUnmatchedClick = (item) => {
    setPreviewItem({ type: 'unmatched', data: item });
    setPreviewDetails(null);
    setDrawerOpen(true);
  };

  useEffect(() => {
    loadAnalytics();
    loadServiceStatus();
    const timer = setInterval(() => {
      loadAnalytics();
      loadServiceStatus();
    }, 10000);
    return () => clearInterval(timer);
  }, [tenantId]);

  useEffect(() => {
    if (logsExpanded) {
      fetchLogs();
      let timer;
      if (autoRefreshLogs) {
        timer = setInterval(fetchLogs, 5000);
      }
      return () => clearInterval(timer);
    }
  }, [tenantId, logsExpanded, autoRefreshLogs]);

  if (!data) {
    return (
      <div className="tab-content active">
        <div className="section-card">
          <div className="empty-state">
            <div className="es-icon"><RotateCw className="spin" /></div>
            <h3>Loading Kanban Dashboard…</h3>
          </div>
        </div>
      </div>
    );
  }

  const { metrics, recent_stream = [], pending_items = {} } = data;
  const { negotiations = [], deficits = [], unmatched = [] } = pending_items;

  // Formatting date helper
  const formatTime = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts.replace(' ', 'T') + 'Z');
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch (e) {
      return ts;
    }
  };

  // Sort stream by timestamp descending (newest first) to guarantee perfect ordering
  const sortedStream = [...recent_stream].sort((a, b) => {
    const tA = a.timestamp ? new Date(a.timestamp.replace(' ', 'T')).getTime() : 0;
    const tB = b.timestamp ? new Date(b.timestamp.replace(' ', 'T')).getTime() : 0;
    return tB - tA;
  });

  // 1. New Mail Column Data: Active client incoming queries from the stream (unprocessed/pending review/unmatched/negotiating)
  const newMails = sortedStream.filter(item => 
    item.customer_email !== "System / Marketing" && 
    item.status !== "Auto-Filtered" && 
    item.status !== "QUOTE_GENERATED" && 
    item.status !== "QUOTE_UPDATED" && 
    item.status !== "NEGOTIATION_APPROVED" && 
    item.status !== "NEGOTIATION_REJECTED"
  );

  // 2. Responded Column Data: Auto-quotes, completed items, and auto-filtered items
  const respondedMails = sortedStream.filter(item => 
    item.status === "Auto-Filtered" || 
    item.status === "QUOTE_GENERATED" || 
    item.status === "QUOTE_UPDATED" || 
    item.status === "NEGOTIATION_APPROVED" || 
    item.status === "NEGOTIATION_REJECTED"
  );

  // 3. Pending Column Data: Combined list of deficits, escalated negotiations, and unmatched items
  const pendingItemsList = [
    ...deficits.map(d => ({ ...d, type: 'deficit', key: `def-${d.id}` })),
    ...negotiations.map(n => ({ ...n, type: 'negotiation', key: `neg-${n.invoice_id}` })),
    ...unmatched.map(u => ({ ...u, type: 'unmatched', key: `unm-${u.id}` }))
  ];

  // Apply real-time local search filtering
  const filteredNewMails = newMails.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.customer_name || '').toLowerCase().includes(term) ||
      (item.customer_email || '').toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term) ||
      (item.invoice_id || '').toLowerCase().includes(term)
    );
  });

  const filteredRespondedMails = respondedMails.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.customer_name || '').toLowerCase().includes(term) ||
      (item.customer_email || '').toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term) ||
      (item.invoice_id || '').toLowerCase().includes(term) ||
      (item.status || '').toLowerCase().includes(term)
    );
  });

  const filteredPendingItemsList = pendingItemsList.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.customer_name || '').toLowerCase().includes(term) ||
      (item.customer_email || '').toLowerCase().includes(term) ||
      (item.sku_name || '').toLowerCase().includes(term) ||
      (item.sku_id || '').toLowerCase().includes(term) ||
      (item.invoice_id || '').toLowerCase().includes(term) ||
      (item.type || '').toLowerCase().includes(term)
    );
  });

  const getTodayMails = () => {
    const todayStr = new Date().toLocaleDateString('en-IN');
    return recent_stream.filter(item => {
      if (!item.timestamp) return false;
      try {
        const mailDate = new Date(item.timestamp.replace(' ', 'T') + 'Z');
        const mailDateStr = mailDate.toLocaleDateString('en-IN');
        return mailDateStr === todayStr;
      } catch (e) {
        return false;
      }
    });
  };

  const getYesterdayMails = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-IN');
    return recent_stream.filter(item => {
      if (!item.timestamp) return false;
      try {
        const mailDate = new Date(item.timestamp.replace(' ', 'T') + 'Z');
        const mailDateStr = mailDate.toLocaleDateString('en-IN');
        return mailDateStr === yesterdayStr;
      } catch (e) {
        return false;
      }
    });
  };

  const getUnifiedPipelineItems = () => {
    const items = [];
    
    // Add New Mails
    filteredNewMails.forEach(item => {
      items.push({
        id: item.message_id || `new-${item.invoice_id}-${item.timestamp}`,
        timestamp: item.timestamp,
        type: 'new_mail',
        customer_name: item.customer_name,
        customer_email: item.customer_email,
        details: item.description,
        status: 'New Enquiry',
        statusType: 'blue',
        invoice_id: item.invoice_id,
        rawItem: item
      });
    });

    // Add Responded Mails
    filteredRespondedMails.forEach(item => {
      const isSpam = item.status === "Auto-Filtered";
      items.push({
        id: item.message_id || `resp-${item.invoice_id}-${item.timestamp}`,
        timestamp: item.timestamp,
        type: 'responded',
        customer_name: item.customer_name,
        customer_email: item.customer_email,
        details: item.status === "Auto-Filtered" ? "Spam / Auto-filtered (System/Marketing)" : "Quotation reply sent successfully",
        status: item.status,
        statusType: isSpam ? 'gray' : 'green',
        invoice_id: item.invoice_id,
        rawItem: item
      });
    });

    // Add Pending items
    filteredPendingItemsList.forEach(item => {
      if (item.type === 'deficit') {
        items.push({
          id: item.key || `deficit-${item.invoice_id}`,
          timestamp: item.created_at,
          type: 'deficit',
          customer_name: 'Trofeo Stock Manager',
          customer_email: `Invoice ID: ${item.invoice_id}`,
          details: `Stock Shortage: ${item.sku_name} (Shortage: ${item.deficit_qty} units)`,
          status: 'Stock Shortage',
          statusType: 'red',
          invoice_id: item.invoice_id,
          rawItem: item
        });
      } else if (item.type === 'negotiation') {
        items.push({
          id: item.key || `neg-${item.invoice_id}`,
          timestamp: item.created_at,
          type: 'negotiation',
          customer_name: item.customer_name,
          customer_email: `Invoice ID: ${item.invoice_id}`,
          details: `Requested Discount: ${Math.round(item.discount_pct * 100)}% (Excl: ₹${(item.subtotal * (1 - (item.discount_pct || 0))).toLocaleString('en-IN', { maximumFractionDigits: 2 })} | Incl: ₹${item.grand_total.toLocaleString('en-IN')})`,
          status: 'Escalated',
          statusType: 'yellow',
          invoice_id: item.invoice_id,
          rawItem: item
        });
      } else {
        items.push({
          id: item.key || `unmatched-${item.created_at}`,
          timestamp: item.created_at,
          type: 'unmatched',
          customer_name: item.customer_name || 'Prospect',
          customer_email: item.customer_email,
          details: `Unmatched Enquiry: "${item.original_body}"`,
          status: 'Unmatched',
          statusType: 'orange',
          invoice_id: null,
          rawItem: item
        });
      }
    });

    // Sort by timestamp descending
    return items.sort((a, b) => {
      const getMs = (ts) => {
        if (!ts) return 0;
        try {
          return new Date(ts.replace(' ', 'T') + 'Z').getTime();
        } catch (e) {
          return 0;
        }
      };
      return getMs(b.timestamp) - getMs(a.timestamp);
    });
  };

  const getTrendData = () => {
    switch(chartTab) {
      case 'new':
        return {
          title: 'New Mails',
          actual: [12, 18, 15, 22, 28, 20, filteredNewMails.length],
          projected: [15, 16, 20, 25, 26, 22, filteredNewMails.length + 3],
          yMax: 40
        };
      case 'responded':
        return {
          title: 'Responded',
          actual: [120, 135, 130, 145, 158, 148, filteredRespondedMails.length],
          projected: [110, 125, 140, 150, 165, 155, filteredRespondedMails.length + 10],
          yMax: 200
        };
      case 'pending':
        return {
          title: 'Pending Review',
          actual: [45, 58, 62, 70, 78, 85, filteredPendingItemsList.length],
          projected: [40, 50, 65, 68, 80, 88, filteredPendingItemsList.length + 5],
          yMax: 120
        };
      case 'total':
      default:
        return {
          title: 'Total Volume',
          actual: [250, 280, 310, 340, 380, 420, metrics.total_received],
          projected: [240, 290, 300, 350, 400, 430, metrics.total_received + 20],
          yMax: 650
        };
    }
  };

  const trend = getTrendData();

  const generateSvgPath = (dataArr) => {
    return dataArr.map((val, i) => {
      const x = (i / 6) * 500;
      const y = 150 - (val / trend.yMax) * 120 - 15;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="tab-content active" id="content-overview">
      
      {/* Dynamic Interactive CSS Styles */}
      <style>{`
        .kanban-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          min-width: 0;
        }
        .kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 82, 204, 0.06), 0 2px 4px rgba(0, 82, 204, 0.02);
          border-color: rgba(0, 82, 204, 0.25);
        }
        .overview-kpi-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 0.85rem 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
          transition: all 0.25s ease;
        }
        .overview-kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(0, 82, 204, 0.2);
          box-shadow: 0 8px 24px rgba(0, 82, 204, 0.06);
        }
        .search-input:focus {
          border-color: #3B82F6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
        }
      `}</style>

      {/* Service Status Monitor Banner */}
      {(() => {
        const { status, last_seen, error_message } = serviceStatus;
        
        let bgColor = '#F1F5F9';
        let borderColor = '#CBD5E1';
        let textColor = '#475569';
        let dotColor = '#94A3B8';
        let statusText = 'Email Listener Service is offline or status is unknown';
        
        if (status === 'CONNECTED' || status === 'IDLE') {
          bgColor = '#ECFDF5';
          borderColor = '#A7F3D0';
          textColor = '#065F46';
          dotColor = '#10B981';
          statusText = `Email Listener Service: Active (${status})`;
        } else if (status === 'AUTH_FAILED') {
          bgColor = '#FEF3C7';
          borderColor = '#FDE68A';
          textColor = '#92400E';
          dotColor = '#F59E0B';
          statusText = 'Email Listener Service: Authentication Failed (Check M365 Credentials)';
        } else if (status === 'ERROR') {
          bgColor = '#FEF2F2';
          borderColor = '#FCA5A5';
          textColor = '#991B1B';
          dotColor = '#EF4444';
          statusText = 'Email Listener Service: Error / Crashed';
        }
        
        return (
          <div style={{
            background: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            fontSize: '0.82rem',
            color: textColor,
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.01)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '600' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: dotColor,
                  display: 'inline-block',
                  boxShadow: status === 'CONNECTED' || status === 'IDLE' ? '0 0 8px #10B981' : 'none'
                }}></span>
                <span>{statusText}</span>
              </div>
              {last_seen && (
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  Last Active: {formatTime(last_seen)}
                </span>
              )}
            </div>
            {error_message && (
              <div style={{
                marginTop: '0.2rem',
                padding: '0.5rem 0.75rem',
                background: 'rgba(0, 0, 0, 0.03)',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                wordBreak: 'break-all'
              }}>
                <strong>Details:</strong> {error_message}
              </div>
            )}
          </div>
        );
      })()}

      {/* Aurora Metrics & Chart Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '1.5rem', marginBottom: '1.5rem' }} className="aurora-grid-container">
        
        {/* Left Column: 2x2 KPIs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          
          {/* Card 1: Total Emails */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Mail size={18} />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Total Emails</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.25rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                {metrics.total_received}
              </h3>
            </div>
            <a href="#emails" onClick={(e) => { e.preventDefault(); setViewMode('table'); }} style={{ fontSize: '0.72rem', color: '#3B82F6', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
              See in-depth Email volume <ExternalLink size={10} />
            </a>
          </div>

          {/* Card 2: Auto-Responded */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <ShieldCheck size={18} />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Auto-Responded</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.25rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                {metrics.auto_responded}
              </h3>
            </div>
            <a href="#auto" onClick={(e) => { e.preventDefault(); setViewMode('table'); }} style={{ fontSize: '0.72rem', color: '#3B82F6', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
              See page-wise Performance <ExternalLink size={10} />
            </a>
          </div>

          {/* Card 3: Waiting Review */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <UserCheck size={18} />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Waiting Review</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.25rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                {metrics.pending_approval}
              </h3>
            </div>
            <a href="#pending" onClick={(e) => { e.preventDefault(); setViewMode('kanban'); }} style={{ fontSize: '0.72rem', color: '#3B82F6', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
              See pending Decisions <ExternalLink size={10} />
            </a>
          </div>

          {/* Card 4: Tool Efficiency */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Activity size={18} />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Tool Efficiency</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.25rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                {metrics.tool_efficiency_pct}%
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '500', marginTop: '0.5rem' }}>
              Auto-resolution index
            </span>
          </div>

        </div>

        {/* Right Column: Aurora Chart Component */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          {/* Chart Header Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem', marginBottom: '1rem', gap: '1.25rem' }}>
            <button onClick={() => setChartTab('new')} style={{ background: 'none', border: 'none', borderBottom: chartTab === 'new' ? '2px solid #3B82F6' : '2px solid transparent', paddingBottom: '0.5rem', cursor: 'pointer', textAlign: 'left', outline: 'none' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: chartTab === 'new' ? '#3B82F6' : '#64748B' }}>New Mails</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', marginTop: '0.1rem', fontFamily: 'var(--font-display)' }}>{filteredNewMails.length}</div>
            </button>
            <button onClick={() => setChartTab('responded')} style={{ background: 'none', border: 'none', borderBottom: chartTab === 'responded' ? '2px solid #3B82F6' : '2px solid transparent', paddingBottom: '0.5rem', cursor: 'pointer', textAlign: 'left', outline: 'none' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: chartTab === 'responded' ? '#3B82F6' : '#64748B' }}>Responded</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', marginTop: '0.1rem', fontFamily: 'var(--font-display)' }}>{filteredRespondedMails.length}</div>
            </button>
            <button onClick={() => setChartTab('pending')} style={{ background: 'none', border: 'none', borderBottom: chartTab === 'pending' ? '2px solid #3B82F6' : '2px solid transparent', paddingBottom: '0.5rem', cursor: 'pointer', textAlign: 'left', outline: 'none' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: chartTab === 'pending' ? '#3B82F6' : '#64748B' }}>Pending Review</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', marginTop: '0.1rem', fontFamily: 'var(--font-display)' }}>{filteredPendingItemsList.length}</div>
            </button>
            <button onClick={() => setChartTab('total')} style={{ background: 'none', border: 'none', borderBottom: chartTab === 'total' ? '2px solid #3B82F6' : '2px solid transparent', paddingBottom: '0.5rem', cursor: 'pointer', textAlign: 'left', outline: 'none' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: chartTab === 'total' ? '#3B82F6' : '#64748B' }}>Total Volume</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', marginTop: '0.1rem', fontFamily: 'var(--font-display)' }}>{metrics.total_received}</div>
            </button>
          </div>

          {/* Chart Legend */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', fontSize: '0.7rem', color: '#64748B', marginBottom: '0.5rem', fontWeight: '700' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '12px', height: '2px', background: '#3B82F6', display: 'inline-block' }}></span>
              Actual Value
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #10B981', display: 'inline-block' }}></span>
              Projected Value
            </span>
          </div>

          {/* SVG Line Chart */}
          <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '160px', position: 'relative' }}>
            <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Horizontal Grid lines */}
              <line x1="0" y1="15" x2="500" y2="15" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="55" x2="500" y2="55" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="95" x2="500" y2="95" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="135" x2="500" y2="135" stroke="#F1F5F9" strokeWidth="1" />
              
              {/* Paths */}
              <path d={generateSvgPath(trend.projected)} fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="4 4" />
              <path d={generateSvgPath(trend.actual)} fill="none" stroke="#3B82F6" strokeWidth="2.5" />
              
              {/* Actual Circles (nodes) */}
              {trend.actual.map((val, i) => {
                const x = (i / 6) * 500;
                const y = 150 - (val / trend.yMax) * 120 - 15;
                return (
                  <g key={`act-${i}`}>
                    <circle cx={x} cy={y} r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x={x} y={y - 8} fontSize="7" fontWeight="700" fill="#0F172A" textAnchor="middle">
                      {val}
                    </text>
                  </g>
                );
              })}
              
              {/* X Axis Labels (Mon to Sun) */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <text key={day} x={(i / 6) * 500} y="152" fontSize="8" fontWeight="600" fill="#94A3B8" textAnchor="middle">
                  {day}
                </text>
              ))}
            </svg>
          </div>
        </div>

      </div>

      {/* 2. Visual Efficiency Comparison & Mails Split (Today vs Yesterday) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '1.75rem' }} className="aurora-grid-container">
        
        {/* Left Column: Stacked Today and Yesterday Mails */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Card 1: Today's Enquiries */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.15rem', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                📅 Today's Enquiries
              </h3>
              <span style={{ fontSize: '0.68rem', color: '#0284C7', fontWeight: '700', background: '#E0F2FE', padding: '0.15rem 0.45rem', borderRadius: '10px' }}>
                {getTodayMails().length} Emails
              </span>
            </div>
            
            <div style={{ maxHeight: '110px', overflowY: 'auto', border: '1px solid #F1F5F9', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem', color: '#475569', fontWeight: '700', borderBottom: '1px solid #E2E8F0' }}>Sender</th>
                    <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem', color: '#475569', fontWeight: '700', borderBottom: '1px solid #E2E8F0' }}>Time</th>
                    <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem', color: '#475569', fontWeight: '700', borderBottom: '1px solid #E2E8F0' }}>Details</th>
                    <th style={{ textAlign: 'center', padding: '0.35rem 0.5rem', color: '#475569', fontWeight: '700', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getTodayMails().length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '1.25rem', color: '#64748B' }}>
                        No emails arrived today.
                      </td>
                    </tr>
                  ) : (
                    getTodayMails().map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.35rem 0.5rem', fontWeight: '600', color: '#0F172A' }}>
                          <div>{item.customer_name}</div>
                          <div style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: '500' }}>{item.customer_email}</div>
                        </td>
                        <td style={{ padding: '0.35rem 0.5rem', color: '#475569', whiteSpace: 'nowrap' }}>
                          {formatTime(item.timestamp).split(' ')[1] || formatTime(item.timestamp)}
                        </td>
                        <td style={{ padding: '0.35rem 0.5rem', color: '#334155' }}>
                          {item.description}
                        </td>
                        <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center' }}>
                          <span className={`pill ${item.status === 'Auto-Filtered' ? 'gray' : (item.status.includes('NEGOTIATING') || item.status.includes('ESCALATED') ? 'yellow' : 'green')}`} style={{ fontSize: '0.58rem', padding: '0.05rem 0.3rem' }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Yesterday's Enquiries */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.15rem', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                🕰️ Yesterday's Enquiries
              </h3>
              <span style={{ fontSize: '0.68rem', color: '#475569', fontWeight: '700', background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '10px' }}>
                {getYesterdayMails().length} Emails
              </span>
            </div>
            
            <div style={{ maxHeight: '110px', overflowY: 'auto', border: '1px solid #F1F5F9', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem', color: '#475569', fontWeight: '700', borderBottom: '1px solid #E2E8F0' }}>Sender</th>
                    <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem', color: '#475569', fontWeight: '700', borderBottom: '1px solid #E2E8F0' }}>Time</th>
                    <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem', color: '#475569', fontWeight: '700', borderBottom: '1px solid #E2E8F0' }}>Details</th>
                    <th style={{ textAlign: 'center', padding: '0.35rem 0.5rem', color: '#475569', fontWeight: '700', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getYesterdayMails().length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '1.25rem', color: '#64748B' }}>
                        No emails arrived yesterday.
                      </td>
                    </tr>
                  ) : (
                    getYesterdayMails().map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.35rem 0.5rem', fontWeight: '600', color: '#0F172A' }}>
                          <div>{item.customer_name}</div>
                          <div style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: '500' }}>{item.customer_email}</div>
                        </td>
                        <td style={{ padding: '0.35rem 0.5rem', color: '#475569', whiteSpace: 'nowrap' }}>
                          {formatTime(item.timestamp).split(' ')[1] || formatTime(item.timestamp)}
                        </td>
                        <td style={{ padding: '0.35rem 0.5rem', color: '#334155' }}>
                          {item.description}
                        </td>
                        <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center' }}>
                          <span className={`pill ${item.status === 'Auto-Filtered' ? 'gray' : (item.status.includes('NEGOTIATING') || item.status.includes('ESCALATED') ? 'yellow' : 'green')}`} style={{ fontSize: '0.58rem', padding: '0.05rem 0.3rem' }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: System Operations Efficiency */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⚙️ Operations Efficiency
            </h3>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '500' }}>
              Total Volume: <strong>{metrics.total_received} emails</strong>
            </span>
          </div>

          {/* Horizontal Progress Gauge */}
          <div style={{ height: '28px', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden', display: 'flex', position: 'relative', marginBottom: '1rem' }}>
            <div 
              style={{ 
                width: `${metrics.tool_efficiency_pct}%`, 
                background: 'linear-gradient(90deg, #6366F1, #3B82F6)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#FFFFFF', 
                fontSize: '0.72rem', 
                fontWeight: '700',
                transition: 'width 0.5s ease-in-out'
              }}
              title={`Automated: ${metrics.auto_responded} emails`}
            >
              {metrics.tool_efficiency_pct >= 20 ? `🤖 ${metrics.tool_efficiency_pct}%` : ''}
            </div>
            <div 
              style={{ 
                width: `${metrics.human_intervention_pct}%`, 
                background: 'linear-gradient(90deg, #F59E0B, #EF4444)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#FFFFFF', 
                fontSize: '0.72rem', 
                fontWeight: '700',
                transition: 'width 0.5s ease-in-out'
              }}
              title={`Human Review: ${metrics.pending_approval} emails`}
            >
              {metrics.human_intervention_pct >= 20 ? `👤 ${metrics.human_intervention_pct}%` : ''}
            </div>
          </div>

          {/* Vertical Legend / Breakdown for Compact Fit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.72rem', color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }}></span>
              <span><strong>{metrics.auto_responded}</strong> Automated resolution</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }}></span>
              <span><strong>{metrics.pending_approval}</strong> Human intervention required</span>
            </div>
          </div>
        </div>

      </div>

      {/* Live Pipeline Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📋 Live Operations Pipeline
          </h2>
          <p style={{ color: '#475569', fontSize: '0.76rem', marginTop: '0.25rem' }}>
            Track and process incoming customer emails, automatic responses, and pending human-in-the-loop decisions.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Segmented View Mode Toggle */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.2rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <button 
              onClick={() => setViewMode('table')} 
              style={{
                background: viewMode === 'table' ? '#FFFFFF' : 'none',
                border: 'none',
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: viewMode === 'table' ? '#0F172A' : '#64748B',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="Switch to compact list Table View to fit the screen perfectly."
            >
              Table View
            </button>
            <button 
              onClick={() => setViewMode('kanban')} 
              style={{
                background: viewMode === 'kanban' ? '#FFFFFF' : 'none',
                border: 'none',
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: viewMode === 'kanban' ? '#0F172A' : '#64748B',
                cursor: 'pointer',
                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="Switch to columns Kanban Board layout."
            >
              Kanban Board
            </button>
          </div>

          <input 
            type="text" 
            placeholder="Search records (email, SKU, ID)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '0.8rem',
              width: '220px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            className="search-input"
            title="Search pipeline records by customer name, email address, quoted SKU name, or quote reference number."
          />
          <button className="btn btn-ghost btn-sm" onClick={loadAnalytics} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }} title="Fetch latest incoming emails and update the pipeline layout with current records.">
            <RotateCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Refreshing...' : 'Refresh Pipeline'}
          </button>
        </div>
      </div>

      {/* Pipeline View Mode Content */}
      {viewMode === 'table' ? (
        <div className="data-table-wrapper" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '160px', padding: '0.85rem 1rem' }}>Date/Time</th>
                <th style={{ width: '130px', padding: '0.85rem 1rem' }}>Type</th>
                <th style={{ width: '220px', padding: '0.85rem 1rem' }}>Customer / Contact</th>
                <th style={{ padding: '0.85rem 1rem' }}>Pipeline Details</th>
                <th style={{ width: '140px', padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ width: '120px', padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getUnifiedPipelineItems().length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                    No records match the current search filters.
                  </td>
                </tr>
              ) : (
                getUnifiedPipelineItems().map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => {
                      if (item.type === 'unmatched') {
                        handleUnmatchedClick(item.rawItem);
                      } else if (item.invoice_id) {
                        handleCardClick(item.invoice_id);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ color: '#64748B', fontWeight: '500' }}>{formatTime(item.timestamp)}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600', fontSize: '0.78rem' }}>
                        {item.type === 'new_mail' && <><Mail size={13} style={{ color: '#3B82F6' }} /> Enquiry</>}
                        {item.type === 'responded' && <><ShieldCheck size={13} style={{ color: '#10B981' }} /> Responded</>}
                        {item.type === 'deficit' && <><AlertTriangle size={13} style={{ color: '#EF4444' }} /> Shortage</>}
                        {item.type === 'negotiation' && <><MessageSquare size={13} style={{ color: '#2563EB' }} /> Negotiation</>}
                        {item.type === 'unmatched' && <><UserCheck size={13} style={{ color: '#F59E0B' }} /> Unmatched</>}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0F172A' }}>{item.customer_name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', wordBreak: 'break-all' }}>{item.customer_email}</div>
                    </td>
                    <td style={{ color: '#475569', fontWeight: '500' }}>{item.details}</td>
                    <td>
                      <span className={`pill ${item.statusType}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      {item.type === 'new_mail' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleCardClick(item.invoice_id)} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#FFFFFF', border: '1px solid #CBD5E1' }} title="View raw enquiry details and process quote.">
                          Details <ArrowRight size={11} />
                        </button>
                      )}
                      {item.type === 'responded' && item.invoice_id && (
                        <button className="btn btn-ghost btn-sm" onClick={() => openQuoteComparison ? openQuoteComparison(item.invoice_id, item.customer_name) : (navigateToTab ? navigateToTab('quotes', item.invoice_id) : setActiveTab('quotes'))} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#FFFFFF', border: '1px solid #CBD5E1' }} title="View raw enquiry request vs AI response details.">
                          View Quote <ExternalLink size={11} />
                        </button>
                      )}
                      {item.type === 'deficit' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => navigateToTab ? navigateToTab('deficits', item.invoice_id) : setActiveTab('deficits')} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#EF4444', background: '#FFFFFF', border: '1px solid #FCA5A5' }} title="Navigate to the Deficits tab to resolve this item shortage by matching alternative products.">
                          Resolve <ArrowRight size={11} />
                        </button>
                      )}
                      {item.type === 'negotiation' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => navigateToTab ? navigateToTab('negotiations', item.invoice_id) : setActiveTab('negotiations')} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#3B82F6', background: '#FFFFFF', border: '1px solid #BFDBFE' }} title="Navigate to the Price Negotiations Desk to accept, counter-offer, or reject the discount request.">
                          Decide <ArrowRight size={11} />
                        </button>
                      )}
                      {item.type === 'unmatched' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => navigateToTab ? navigateToTab('simulator', item.customer_email) : setActiveTab('simulator')} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#D97706', background: '#FFFFFF', border: '1px solid #FDE68A' }} title="Open this prospect enquiry in the Live Simulator to map and process it manually.">
                          View <ArrowRight size={11} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="kanban-grid">
          
          {/* COLUMN 1: NEW MAIL */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span className="kanban-column-title">
                <Mail size={15} style={{ color: '#3B82F6' }} /> New Mail
              </span>
              <span className="kanban-column-badge blue">
                {filteredNewMails.length}
              </span>
            </div>

            <div className="kanban-cards-container">
              {filteredNewMails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.75rem' }}>
                  No client enquiries match the criteria.
                </div>
              ) : (
                filteredNewMails.map((item, idx) => (
                  <div key={item.message_id || idx} className="kanban-card new-mail" onClick={() => handleCardClick(item.invoice_id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="card-title">{item.customer_name}</span>
                      <span style={{ fontSize: '0.6rem', color: '#64748B', fontWeight: '500' }}>{formatTime(item.timestamp)}</span>
                    </div>
                    <span className="card-subtitle">{item.customer_email}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: '#0052CC', marginTop: '0.1rem', fontWeight: '600' }}>
                      <CornerDownRight size={10} />
                      <span>{item.description}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: RESPONDED EMAIL */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span className="kanban-column-title">
                <ShieldCheck size={15} style={{ color: '#10B981' }} /> Responded Email
              </span>
              <span className="kanban-column-badge green">
                {filteredRespondedMails.length}
              </span>
            </div>

            <div className="kanban-cards-container">
              {filteredRespondedMails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.75rem' }}>
                  No responded emails match the criteria.
                </div>
              ) : (
                filteredRespondedMails.map((item, idx) => {
                  const isSpam = item.status === "Auto-Filtered";
                  return (
                    <div key={item.message_id || idx} className={`kanban-card responded ${isSpam ? 'spam' : ''}`} onClick={() => !isSpam && handleCardClick(item.invoice_id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className="card-title" style={{ color: isSpam ? '#64748B' : '#0F172A' }}>{item.customer_name}</span>
                        <span style={{ fontSize: '0.6rem', color: '#64748B' }}>{formatTime(item.timestamp)}</span>
                      </div>
                      <span className="card-subtitle">{item.customer_email}</span>
                      <div className="card-footer">
                        <span className={`pill ${isSpam ? 'gray' : 'green'}`} style={{ fontSize: '0.6rem', padding: '0.05rem 0.35rem' }}>
                          {item.status}
                        </span>
                        {!isSpam && (
                          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openQuoteComparison ? openQuoteComparison(item.invoice_id, item.customer_name) : (navigateToTab ? navigateToTab('quotes', item.invoice_id) : setActiveTab('quotes')); }} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#FFFFFF', border: '1px solid #CBD5E1' }} title="View raw enquiry request vs AI response details.">
                            View Quote <ExternalLink size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 3: PENDING APPROVAL */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span className="kanban-column-title">
                <UserCheck size={15} style={{ color: '#F59E0B' }} /> Pending Approval
              </span>
              <span className="kanban-column-badge yellow" style={{ color: '#000' }}>
                {filteredPendingItemsList.length}
              </span>
            </div>

            <div className="kanban-cards-container">
              {filteredPendingItemsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.75rem' }}>
                  No pending items match the criteria.
                </div>
              ) : (
                filteredPendingItemsList.map((item) => {
                  if (item.type === 'deficit') {
                    return (
                      <div key={item.key} className="kanban-card deficit" onClick={() => handleCardClick(item.invoice_id)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ color: '#DC2626', fontWeight: '700', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <AlertTriangle size={10} /> Stock Shortage
                          </span>
                          <span style={{ fontSize: '0.6rem', color: '#78716C' }}>{formatTime(item.created_at)}</span>
                        </div>
                        <span className="card-title">{item.sku_name}</span>
                        <div className="card-description">
                          Shortage: <span style={{ color: '#DC2626', fontWeight: '700' }}>{item.deficit_qty} units</span>
                        </div>
                        <div className="card-footer">
                          <span className="card-footer-text">Inv: {item.invoice_id}</span>
                          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigateToTab ? navigateToTab('deficits', item.invoice_id) : setActiveTab('deficits'); }} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', color: '#EF4444', background: '#FFFFFF', border: '1px solid #FCA5A5' }} title="Navigate to the Deficits tab to resolve this item shortage by matching alternative products.">
                            Resolve <ArrowRight size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'negotiation') {
                    return (
                      <div key={item.key} className="kanban-card negotiation" onClick={() => handleCardClick(item.invoice_id)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ color: '#2563EB', fontWeight: '700', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <MessageSquare size={10} /> Negotiation
                          </span>
                          <span style={{ fontSize: '0.6rem', color: '#475569', fontWeight: '500' }}>Escalated</span>
                        </div>
                        <span className="card-title">{item.customer_name}</span>
                        <div className="card-description">
                          Requested: <span style={{ color: '#2563EB', fontWeight: '700' }}>{Math.round(item.discount_pct * 100)}%</span> (Excl: ₹{(item.subtotal * (1 - (item.discount_pct || 0))).toLocaleString('en-IN', { maximumFractionDigits: 2 })} | Incl: ₹{item.grand_total.toLocaleString('en-IN')})
                        </div>
                        <div className="card-footer">
                          <span className="card-footer-text">Inv: {item.invoice_id}</span>
                          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigateToTab ? navigateToTab('negotiations', item.invoice_id) : setActiveTab('negotiations'); }} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', color: '#3B82F6', background: '#FFFFFF', border: '1px solid #BFDBFE' }} title="Navigate to the Price Negotiations Desk to accept, counter-offer, or reject the discount request.">
                            Decide <ArrowRight size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={item.key} className="kanban-card unmatched" onClick={() => handleUnmatchedClick(item)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ color: '#D97706', fontWeight: '700', fontSize: '0.68rem' }}>Unmatched</span>
                          <span style={{ fontSize: '0.6rem', color: '#78350F' }}>{formatTime(item.created_at)}</span>
                        </div>
                        <span className="card-title">{item.customer_name || 'Prospect'}</span>
                        <p className="card-description" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', margin: 0 }}>
                          "{item.original_body}"
                        </p>
                        <div className="card-footer">
                          <span className="card-footer-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{item.customer_email}</span>
                          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigateToTab ? navigateToTab('simulator', item.customer_email) : setActiveTab('simulator'); }} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', color: '#D97706', background: '#FFFFFF', border: '1px solid #FDE68A' }} title="Open this prospect enquiry in the Live Simulator to map and process it manually.">
                            View <ArrowRight size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  }
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* Collapsible System Log Console */}
      <div style={{
        marginTop: '2.5rem',
        background: '#0F172A',
        borderRadius: '16px',
        border: '1px solid #1E293B',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        color: '#F8FAFC'
      }}>
        {/* Header */}
        <div style={{
          padding: '0.85rem 1.25rem',
          background: '#1E293B',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }} onClick={() => setLogsExpanded(!logsExpanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={16} style={{ color: '#10B981' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: '700', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              📜 System Log Console {logsExpanded ? '(Live)' : '(Collapsed)'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
            {logsExpanded && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', cursor: 'pointer', color: '#94A3B8' }}>
                <input 
                  type="checkbox" 
                  checked={autoRefreshLogs} 
                  onChange={(e) => setAutoRefreshLogs(e.target.checked)}
                />
                Auto-refresh (5s)
              </label>
            )}
            {logsExpanded && (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={fetchLogs} 
                style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
              >
                Refresh
              </button>
            )}
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => setLogsExpanded(!logsExpanded)}
              style={{ fontSize: '0.75rem', color: '#94A3B8', background: 'none', border: 'none' }}
            >
              {logsExpanded ? 'Collapse ▲' : 'Expand ▼'}
            </button>
          </div>
        </div>

        {/* Console logs box */}
        {logsExpanded && (
          <div style={{
            padding: '1.25rem',
            maxHeight: '280px',
            overflowY: 'auto',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: '0.75rem',
            lineHeight: '1.5',
            background: '#0B0F19',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#64748B', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem' }}>
                No log entries yet.
              </div>
            ) : (
              logs.map((log, idx) => {
                let color = '#E2E8F0';
                if (log.includes('[Error') || log.includes('failed') || log.includes('crashed') || log.includes('Exception')) {
                  color = '#FCA5A5';
                } else if (log.includes('[Success') || log.includes('Processed (status:')) {
                  color = '#86EFAC';
                } else if (log.includes('[Email Filter') || log.includes('Skipped')) {
                  color = '#FDE68A';
                } else if (log.includes('[Poller') || log.includes('[Email Listener]')) {
                  color = '#93C5FD';
                }
                return (
                  <div key={idx} style={{ color, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {log}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Slide-out Preview Drawer Overlay Backdrop */}
      <div 
        className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} 
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* Slide-out Preview Drawer */}
      <div 
        className={`preview-drawer ${drawerOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: drawerOpen ? 0 : (previewItem?.type === 'quote' ? '-770px' : '-460px'),
          width: previewItem?.type === 'quote' ? '750px' : '440px',
          height: '100vh',
          background: '#FFFFFF',
          boxShadow: '-10px 0 30px rgba(15, 23, 42, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #E2E8F0'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC'
        }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              {previewItem?.type === 'quote' ? `Quote Details: ${previewItem.invoiceId}` : 'Unmatched Enquiry Details'}
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              Operations Command Center
            </span>
          </div>
          <button 
            onClick={() => setDrawerOpen(false)} 
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {drawerLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%', gap: '0.5rem', color: '#64748B' }}>
              <RotateCw className="spin" size={24} style={{ color: '#3B82F6' }} />
              <span style={{ fontSize: '0.8rem' }}>Loading transaction records...</span>
            </div>
          ) : previewItem?.type === 'unmatched' ? (
            /* RENDER UNMATCHED DETAILS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: '#92400E', background: '#FEF3C7', padding: '0.15rem 0.55rem', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem' }}>
                  Pending Manual Review
                </span>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                  {previewItem.data.customer_name || 'Prospect Customer'}
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#475569', margin: '0.2rem 0 0 0' }}>
                  {previewItem.data.customer_email}
                </p>
              </div>

              <div>
                <div className="drawer-section-title" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>Original Email Body</div>
                <div style={{
                  padding: '0.85rem',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  color: '#334155',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {previewItem.data.original_body}
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => { setDrawerOpen(false); setActiveTab('simulator'); }}
                  style={{ flex: 1, fontSize: '0.78rem', padding: '0.5rem' }}
                >
                  Open in Ingestion Simulator
                </button>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => setDrawerOpen(false)}
                  style={{ flex: 1, fontSize: '0.78rem', padding: '0.5rem', border: '1px solid #CBD5E1', background: '#FFFFFF' }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : previewDetails ? (
            /* RENDER QUOTE DETAILS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Customer and Status Header */}
              <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    {renderChannelBadge(previewDetails.quotation.source)}
                    <span className="pill" style={{
                      fontSize: '0.65rem',
                      background: previewDetails.quotation.status.includes('NEGOTIATION') ? '#EFF6FF' : '#ECFDF5',
                      color: previewDetails.quotation.status.includes('NEGOTIATION') ? '#2563EB' : '#065F46',
                      border: `1px solid ${previewDetails.quotation.status.includes('NEGOTIATION') ? '#BFDBFE' : '#A7F3D0'}`,
                      padding: '0.1rem 0.5rem'
                    }}>
                      {previewDetails.quotation.status}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '500' }}>
                    Created: {formatTime(previewDetails.quotation.created_at)}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                  {previewDetails.quotation.customer_name}
                </h4>
                <p style={{ fontSize: '0.74rem', color: '#475569', margin: '0.15rem 0 0 0' }}>
                  Email: {previewDetails.quotation.customer_email} | Contact: {previewDetails.quotation.customer_phone || '—'}
                </p>
              </div>

              {/* Side-by-Side: Customer Request vs Automation Response */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                
                {/* Column 1: Customer Request */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.02em', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {getChannelIcon(previewDetails.quotation.source, 12)} Request Received ({previewDetails.quotation.source === 'whatsapp' ? 'WhatsApp' : previewDetails.quotation.source === 'custom' ? 'Manual' : 'Email'})
                  </h4>
                  <div style={{
                    padding: '0.75rem',
                    background: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    color: '#334155',
                    whiteSpace: 'pre-wrap',
                    minHeight: '140px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    lineHeight: '1.4'
                  }}>
                    {(() => {
                      const customerLogs = previewDetails.logs.filter(log => !log.sender.toLowerCase().includes('bot') && !log.sender.toLowerCase().includes('system') && !log.sender.toLowerCase().includes('auto'));
                      if (customerLogs.length > 0) {
                        return customerLogs[customerLogs.length - 1].message;
                      }
                      if (previewDetails.items && previewDetails.items.length > 0) {
                        const itemsList = previewDetails.items.map(it => `- ${it.sku_name || it.sku_id} (Qty: ${it.quantity})`).join('\n');
                        return `Hello, please provide a quotation for the following items:\n${itemsList}`;
                      }
                      return "No incoming message details logged.";
                    })()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontStyle: 'italic' }}>
                    {previewDetails.quotation.source === 'whatsapp' ? 'Received via WhatsApp channel.' : previewDetails.quotation.source === 'custom' ? 'Pasted/Ingested manually via simulator.' : 'Original email body parsed automatically.'}
                  </div>
                </div>

                {/* Column 2: Automation Response */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.78rem', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.02em', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    🤖 Bot Auto-Response Sent
                  </h4>
                  <div style={{
                    padding: '0.75rem',
                    background: '#F0FDF4',
                    border: '1px solid #DCFCE7',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    color: '#166534',
                    whiteSpace: 'pre-wrap',
                    minHeight: '140px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    lineHeight: '1.4'
                  }}>
                    {(() => {
                      const botLogs = previewDetails.logs.filter(log => log.sender.toLowerCase().includes('bot') || log.sender.toLowerCase().includes('system') || log.sender.toLowerCase().includes('auto'));
                      if (botLogs.length > 0) {
                        return botLogs[botLogs.length - 1].message;
                      }
                      if (previewDetails.items && previewDetails.items.length > 0) {
                        const itemsList = previewDetails.items.map(it => `- ${it.sku_name || it.sku_id} (Qty: ${it.quantity}, Price: ₹${it.unit_price})`).join('\n');
                        const totalStr = `\n\nTotal (Incl. Tax): ₹${previewDetails.quotation.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                        return `Dear Customer,\n\nWe have prepared your quotation ${previewDetails.quotation.invoice_id} as requested:\n\n${itemsList}${totalStr}\n\nThank you for choosing Trofeo!`;
                      }
                      return "No automated response logged.";
                    })()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    📎 Attached PDF: {previewDetails.quotation.invoice_id}.pdf
                  </div>
                </div>

              </div>

              {/* Items Breakdown with Exclusive & Inclusive taxes details */}
              <div>
                <div className="drawer-section-title" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>Quotation Line Items</div>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '600' }}>
                        <th style={{ padding: '0.5rem 0.75rem' }}>SKU / Name</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Rate (Excl.)</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Rate (Incl.)</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Total (Excl.)</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Total (Incl.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewDetails.items.map((it) => (
                        <tr key={it.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#0F172A' }}>
                            <div style={{ fontWeight: '500' }}>{it.sku_name}</div>
                            <span style={{ fontSize: '0.65rem', color: '#64748B', fontFamily: 'monospace' }}>{it.sku_id}</span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#334155' }}>
                            {it.quantity}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#334155' }}>
                            ₹{it.unit_price.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#64748B' }}>
                            ₹{(it.unit_price * 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#0F172A', fontWeight: '500' }}>
                            ₹{it.line_total.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#0F172A', fontWeight: '500' }}>
                            ₹{(it.line_total * 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary with Excl and Incl values */}
                <div style={{
                  marginTop: '0.65rem',
                  padding: '0.75rem',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.76rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Subtotal (Excl. Tax):</span>
                    <strong>₹{previewDetails.quotation.subtotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                    <span>Subtotal (Incl. Tax):</span>
                    <span>₹{(previewDetails.quotation.subtotal * 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  {previewDetails.quotation.discount_pct > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontWeight: '500' }}>
                        <span>Discount Rate:</span>
                        <span>{Math.round(previewDetails.quotation.discount_pct * 100)}% off</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Net Subtotal (Excl. Tax):</span>
                        <strong>₹{(previewDetails.quotation.subtotal * (1 - previewDetails.quotation.discount_pct)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                        <span>Net Subtotal (Incl. Tax):</span>
                        <span>₹{((previewDetails.quotation.subtotal * (1 - previewDetails.quotation.discount_pct)) * 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>GST (18% tax):</span>
                    <span>₹{previewDetails.quotation.tax_amt.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.35rem', marginTop: '0.2rem', fontWeight: '800', fontSize: '0.84rem', color: '#0F172A' }}>
                    <span>Grand Total (Incl. Tax):</span>
                    <span style={{ color: '#2563EB' }}>₹{previewDetails.quotation.grand_total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B', fontSize: '0.8rem' }}>
              No detailed data loaded.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
