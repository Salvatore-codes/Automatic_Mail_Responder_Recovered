import React from 'react';
import { LayoutDashboard, Zap, Package, MessageSquareText, FolderOpen, Warehouse, History } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, deficitsCount, negsCount }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null, description: 'View executive operational analytics, service health status, and live email queues.' },
    { id: 'simulator', label: 'Live Simulator', icon: Zap, badge: null, description: 'Simulate incoming customer quote request emails and test AI parsing.' },
    { id: 'deficits', label: 'Deficits', icon: Package, badge: deficitsCount, badgeColor: 'red', description: 'Manage raw material/item deficits and match alternatives for outstanding orders.' },
    { id: 'negotiations', label: 'Negotiations', icon: MessageSquareText, badge: negsCount, badgeColor: 'yellow', description: 'Review, counter-offer, or resolve discount requests escalated by the AI.' },
    { id: 'inventory', label: 'Full Inventory', icon: Warehouse, badge: null, description: 'View current stock levels, base prices, and catalog items.' },
    { id: 'stocklog', label: 'Stock Update Log', icon: History, badge: null, description: 'Audit logs of manual and automated stock quantity and price updates.' }
  ];

  return (
    <aside className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1.75rem 1.25rem' }}>
      
      {/* Brand Header with Trofeo Solution Logo */}
      <div className="nav-brand" style={{ marginBottom: '2rem', padding: '0.25rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'none', border: 'none', boxShadow: 'none' }}>
        <img src="/static/logo.png" alt="Trofeo Solution" style={{ maxWidth: '100%', maxHeight: '55px', objectFit: 'contain' }} />
      </div>
      
      <div className="nav-tabs" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.description}
              style={{
                background: isActive ? '#E0F2FE' : 'transparent',
                color: isActive ? '#0369A1' : '#475569',
                border: 'none',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.82rem',
                fontWeight: isActive ? '700' : '600',
                transition: 'all 0.15s ease'
              }}
            >
              <IconComponent size={16} style={{ color: isActive ? '#0369A1' : '#64748B' }} />
              {tab.label}
              {tab.badge ? (
                <span className={`tab-badge ${tab.badgeColor === 'yellow' ? 'yellow' : ''}`}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Get More Features Premium Banner */}
      <div style={{
        marginTop: '1.5rem',
        background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
        border: '1px solid #A7F3D0',
        borderRadius: '14px',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background circle */}
        <div style={{
          position: 'absolute',
          right: '-12px',
          bottom: '-12px',
          width: '55px',
          height: '55px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.08)',
          zIndex: 1
        }} />
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#065F46', marginBottom: '0.25rem' }}>
            Get More Features
          </h4>
          <p style={{ fontSize: '0.68rem', color: '#047857', marginBottom: '0.75rem', lineHeight: '1.3' }}>
            Unlock multi-warehouse sync, AI smart negotiations, and advanced analytics.
          </p>
          <button 
            style={{
              width: '100%',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.4rem',
              fontSize: '0.7rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#1E293B'}
            onMouseOut={e => e.currentTarget.style.background = '#0F172A'}
            onClick={() => alert("Premium Upgrade is a simulation placeholder.")}
          >
            Explore now
          </button>
        </div>
      </div>
    </aside>
  );
}
