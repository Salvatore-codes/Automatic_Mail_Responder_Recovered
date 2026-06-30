import React, { useState, useEffect } from 'react';
import { Package, CheckCircle2, Store, Users, AlertTriangle, RotateCw } from 'lucide-react';

export default function DeficitsTab({ tenantId, showToast, refreshBadges, invoiceFilter, setInvoiceFilter }) {
  const [deficits, setDeficits] = useState([]);
  const [lowStockData, setLowStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  
  // Resolve Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedDeficit, setSelectedDeficit] = useState(null);
  const [newStock, setNewStock] = useState(10);

  const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadDeficits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deficits?tenant_id=${tenantId}`);
      const data = await res.json();
      setDeficits(data.deficits || []);
    } catch (e) {
      showToast('Error loading deficits: ' + e.message, 'error');
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
    loadDeficits();
    loadLowStock();
  }, [tenantId]);

  const openResolveModal = (deficit) => {
    setSelectedDeficit(deficit);
    setNewStock(deficit.requested_qty);
    setShowModal(true);
  };

  const handleResolve = async () => {
    if (!selectedDeficit) return;
    setResolving(true);
    try {
      const res = await fetch('/api/deficits/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deficit_id: selectedDeficit.id,
          new_stock: parseInt(newStock),
          tenant_id: tenantId
        })
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        showToast('Deficit resolved! Updated quote sent to customer.', 'success');
      } else {
        showToast(data.message || 'Partial resolution.', 'info');
      }
      setShowModal(false);
      loadDeficits();
      loadLowStock();
      refreshBadges();
    } catch (e) {
      showToast('Resolution error: ' + e.message, 'error');
    } finally {
      setResolving(false);
    }
  };

  // KPIs
  const pendingCount = deficits.filter(d => d.status === 'PENDING').length;
  const resolvedCount = deficits.filter(d => d.status === 'RESOLVED').length;
  const uniqueSKUs = new Set(deficits.map(d => d.sku_id)).size;
  const customersWaiting = new Set(deficits.filter(d => d.status === 'PENDING').map(d => d.customer_email)).size;

  return (
    <div className="tab-content active" id="content-deficits">
      
      {/* Low Stock Alert Banner */}
      {lowStockData.length > 0 && (
        <div className="low-stock-banner visible" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle className="banner-icon" style={{ color: '#B91C1C' }} />
          <div className="banner-text">
            <strong>{lowStockData.length} SKU{lowStockData.length > 1 ? 's' : ''}</strong> are at critically low stock levels (≤ 5 units).
            <p>{lowStockData.slice(0, 3).map(s => s.sku_name).join(', ') + (lowStockData.length > 3 ? ' …' : '')}</p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="metrics-row" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card red">
          <div className="kpi-icon"><Package /></div>
          <div className="kpi-content">
            <span>Pending Deficits</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon"><CheckCircle2 /></div>
          <div className="kpi-content">
            <span>Resolved Today</span>
            <strong>{resolvedCount}</strong>
          </div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-icon"><Store /></div>
          <div className="kpi-content">
            <span>Unique SKUs Affected</span>
            <strong>{uniqueSKUs}</strong>
          </div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon"><Users /></div>
          <div className="kpi-content">
            <span>Customers Waiting</span>
            <strong>{customersWaiting}</strong>
          </div>
        </div>
      </div>

      {invoiceFilter && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '0.75rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
          <span style={{ color: '#991B1B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <AlertTriangle size={15} style={{ color: '#EF4444' }} /> Showing only deficits for Invoice: <strong>{invoiceFilter}</strong>
          </span>
          <button className="btn btn-sm" onClick={() => setInvoiceFilter('')} style={{ color: '#991B1B', background: '#FFFFFF', border: '1px solid #FCA5A5', fontSize: '0.75rem', padding: '0.2rem 0.6rem', cursor: 'pointer' }}>
            Show All Deficits
          </button>
        </div>
      )}

      {/* Table */}
      <div className="section-card" style={{ position: 'relative' }}>
        <div className="section-header">
          <h2><AlertTriangle /> Active Stock Deficits</h2>
          <button className="btn btn-ghost btn-sm" onClick={loadDeficits} disabled={loading}>
            <RotateCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
        
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Invoice</th>
                <th>SKU ID</th>
                <th>Product</th>
                <th>Requested</th>
                <th>Available</th>
                <th>Deficit</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && deficits.length === 0 ? (
                <tr>
                  <td colSpan="11">
                    <div className="empty-state">
                      <div className="es-icon"><RotateCw className="spin" /></div>
                      <h3>Loading deficits…</h3>
                    </div>
                  </td>
                </tr>
              ) : deficits.length === 0 ? (
                <tr>
                  <td colSpan="11">
                    <div className="empty-state">
                      <div className="es-icon"><CheckCircle2 style={{ color: '#10B981', opacity: 0.35 }} /></div>
                      <h3>No deficits</h3>
                      <p>All client orders are fully covered by catalog stock.</p>
                    </div>
                  </td>
                </tr>
              ) : deficits.filter(d => !invoiceFilter || d.invoice_id === invoiceFilter).length === 0 ? (
                <tr>
                  <td colSpan="11">
                    <div className="empty-state">
                      <div className="es-icon"><CheckCircle2 style={{ color: '#10B981', opacity: 0.35 }} /></div>
                      <h3>No deficits match filter</h3>
                      <p>All deficits for invoice {invoiceFilter} have been resolved.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                deficits.filter(d => !invoiceFilter || d.invoice_id === invoiceFilter).map((d, idx) => {
                  const date = d.created_at ? d.created_at.split(' ')[0] : '—';
                  const isPending = d.status === 'PENDING';
                  return (
                    <tr key={d.id}>
                      <td className="text-sm text-muted">{idx + 1}</td>
                      <td><span className="pill blue">{d.invoice_id}</span></td>
                      <td className="text-sm"><code>{d.sku_id}</code></td>
                      <td style={{ maxWidth: '180px' }}><strong>{d.sku_name || '—'}</strong></td>
                      <td><strong style={{ color: '#F87171' }}>{d.requested_qty}</strong></td>
                      <td><strong style={{ color: '#FCD34D' }}>{d.available_qty}</strong></td>
                      <td><strong style={{ color: '#F97316' }}>{d.deficit_qty}</strong></td>
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>{d.customer_name || '—'}</div>
                        <div className="text-sm text-muted">{d.customer_email || ''}</div>
                      </td>
                      <td>
                        <span className={`pill ${isPending ? 'red' : 'green'}`}>
                          {isPending ? 'Pending' : 'Resolved'}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{date}</td>
                      <td>
                        {isPending ? (
                          <button className="btn btn-primary btn-sm" onClick={() => openResolveModal(d)}>
                            Resolve
                          </button>
                        ) : (
                          <span className="text-sm text-muted">Done</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Modal */}
      {showModal && selectedDeficit && (
        <div className="modal-overlay open">
          <div className="modal-box">
            <div className="modal-header">
              <h3><Package style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Fulfill Deficit &amp; Update Stock</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="deficit-meta">
                <div className="meta-row"><span>SKU ID</span><span><code>{selectedDeficit.sku_id}</code></span></div>
                <div className="meta-row"><span>Product</span><span>{selectedDeficit.sku_name}</span></div>
                <div className="meta-row"><span>Requested Qty</span><span style={{ color: '#F87171' }}>{selectedDeficit.requested_qty}</span></div>
                <div className="meta-row"><span>Currently Available</span><span style={{ color: '#FCD34D' }}>{selectedDeficit.available_qty}</span></div>
                <div className="meta-row"><span>Deficit Amount</span><span style={{ color: '#F97316', fontWeight: 700 }}>{selectedDeficit.deficit_qty}</span></div>
                <div className="meta-row"><span>Customer</span><span>{selectedDeficit.customer_name} &lt;{selectedDeficit.customer_email}&gt;</span></div>
              </div>
              <hr className="divider" />
              <div className="form-group">
                <label className="form-label">New Stock Quantity to Add</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={e => setNewStock(e.target.value)}
                  className="form-control"
                  min={selectedDeficit.requested_qty}
                  placeholder="Enter new total stock…"
                />
                <p className="text-muted text-sm mt-1">This will update the catalog stock level on disk and trigger the auto-reload. The customer will receive a recalculated quotation email automatically.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleResolve} disabled={resolving}>
                {resolving ? <div className="spinner"></div> : <CheckCircle2 size={14} />} 
                {resolving ? 'Resolving...' : 'Resolve & Email Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
