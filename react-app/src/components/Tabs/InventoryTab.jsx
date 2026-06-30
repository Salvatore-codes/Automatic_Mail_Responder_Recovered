import React, { useState, useEffect } from 'react';
import { Warehouse, RotateCw, Edit } from 'lucide-react';

export default function InventoryTab({ tenantId, showToast, openInventoryModal }) {
  const [catalog, setCatalog] = useState([]);
  const [filteredCatalog, setFilteredCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/catalog?tenant_id=${tenantId}`);
      const data = await res.json();
      const items = data.items || [];
      setCatalog(items);
      filterCatalog(searchQuery, items);
    } catch (e) {
      showToast('Error loading catalog: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [tenantId]);

  const filterCatalog = (query, list = catalog) => {
    const q = query.toLowerCase().trim();
    if (!q) {
      setFilteredCatalog(list);
      return;
    }
    const filtered = list.filter(item =>
      (item.sku_id || '').toLowerCase().includes(q) ||
      (item.sku_name || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    );
    setFilteredCatalog(filtered);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    filterCatalog(val);
  };

  return (
    <div className="tab-content active" id="content-inventory">
      <div className="section-card" style={{ position: 'relative' }}>
        <div className="section-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Warehouse style={{ color: 'var(--accent-blue)' }} /> Full Catalog Inventory
            </h2>
            <p className="text-sm text-muted mt-1" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>View and update stock levels for all products in the catalog.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="form-control"
              placeholder="Search catalog SKUs or names…"
              style={{ width: '250px', padding: '0.45rem 1rem', fontSize: '0.8rem' }}
            />
            <button className="btn btn-ghost btn-sm" onClick={loadCatalog} disabled={loading}>
              <RotateCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th style={{ width: '150px' }}>SKU ID</th>
                <th>Product Name</th>
                <th style={{ width: '150px' }}>Category</th>
                <th style={{ width: '120px' }}>Price</th>
                <th style={{ width: '120px' }}>Stock Level</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && catalog.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <div className="es-icon"><RotateCw className="spin" /></div>
                      <h3>Loading inventory catalog…</h3>
                    </div>
                  </td>
                </tr>
              ) : filteredCatalog.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <div className="es-icon"><Warehouse style={{ opacity: 0.35 }} /></div>
                      <h3>No matching products</h3>
                      <p>Try searching for a different SKU ID or name.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCatalog.map((sku, idx) => {
                  const isZero = sku.stock === 0;
                  const isLow = sku.stock <= 5;
                  
                  let statusPill = <span className="pill green">In Stock</span>;
                  if (isZero) statusPill = <span className="pill red">Out of Stock</span>;
                  else if (isLow) statusPill = <span className="pill yellow">Low Stock</span>;

                  return (
                    <tr key={sku.sku_id}>
                      <td className="text-sm text-muted">{idx + 1}</td>
                      <td><code>{sku.sku_id}</code></td>
                      <td><strong>{sku.sku_name}</strong></td>
                      <td><span className="text-sm text-muted">{sku.category}</span></td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#0F172A' }}>{fmt(sku.price)}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Incl: {fmt(sku.price * 1.18)}</div>
                      </td>
                      <td>
                        <strong style={{ color: isZero ? '#F87171' : isLow ? '#FCD34D' : '#34D399' }}>
                          {sku.stock} units
                        </strong>
                      </td>
                      <td>{statusPill}</td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openInventoryModal(sku.sku_id, sku.sku_name, sku.stock, loadCatalog)}
                        >
                          <Edit size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> 
                          Update Stock
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
    </div>
  );
}
