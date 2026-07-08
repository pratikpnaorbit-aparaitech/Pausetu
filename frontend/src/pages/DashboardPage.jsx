import React, { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Users, UserCheck, Layers, Clock, Download, Printer, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const {
    sellers,
    buyers,
    animals,
    auditLogs,
    widgets,
    handleToggleWidget,
    handleMoveWidgetUp,
    handleExport,
    isLoading,
    apiError,
    dashboardStats,
    loadDashboardData
  } = useContext(AdminContext);

  const getWidget = (id) => widgets.find((w) => w.id === id);

  const handlePrint = () => {
    window.print();
  };

  // 1. Loading Skeleton Screen
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.2s' }}>
        <div style={{ height: 40, width: 220, backgroundColor: '#e2e8f0', borderRadius: 4, className: 'skeleton' }} />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ flex: '1 1 200px', height: 100, backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ height: 16, width: '60%', backgroundColor: '#f1f5f9', borderRadius: 4 }} />
              <div style={{ height: 32, width: '40%', backgroundColor: '#f1f5f9', borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 48%', height: 240, backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
          <div style={{ flex: '1 1 48%', height: 240, backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    );
  }

  // 2. Error Fallback State with Retry Prompt
  if (apiError) {
    return (
      <div style={{ padding: 40, textAlign: 'center', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 500, margin: '40px auto' }}>
        <AlertCircle size={48} color="var(--color-danger)" />
        <h3 style={{ margin: 0, fontWeight: '700', fontSize: 18, color: 'var(--text-heading)' }}>API Request Failed</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          {apiError}. Please verify that the backend server is active and accessible.
        </p>
        <button
          onClick={loadDashboardData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            backgroundColor: 'var(--bg-sidebar)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: 14
          }}
        >
          <RefreshCw size={16} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const kpis = dashboardStats?.kpis || {
    totalSellers: sellers.filter(s => !s.isDeleted).length,
    totalBuyers: buyers.filter(b => !b.isDeleted).length,
    totalAnimals: animals.filter(a => !a.isDeleted).length,
    pendingApprovals: animals.filter(a => a.status === 'pending').length,
    approvedListings: animals.filter(a => a.status === 'approved').length,
    rejectedListings: animals.filter(a => a.status === 'rejected').length,
    soldAnimals: animals.filter(a => a.status === 'sold').length,
    todayRegistrations: 2
  };

  const weeklyStats = dashboardStats?.weeklyStats || [
    { day: 'Mon', value: 45 },
    { day: 'Tue', value: 80 },
    { day: 'Wed', value: 120 },
    { day: 'Thu', value: 95 },
    { day: 'Fri', value: 140 },
    { day: 'Sat', value: 110 },
    { day: 'Sun', value: 160 }
  ];

  const distribution = dashboardStats?.categoryDistribution || {
    Cow: 1,
    Buffalo: 1,
    Goat: 1,
    Sheep: 0,
    Horse: 0,
    Other: 0
  };

  const totalDistCount = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Dashboard top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>System Overview</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Real-time summaries and metric graphs for PashuSetu.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => handleExport('PDF')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              backgroundColor: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: 13
            }}
          >
            <Download size={16} />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              backgroundColor: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: 13
            }}
          >
            <Printer size={16} />
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* Customize Widgets Config Panel */}
      <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border-color)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ margin: 0, fontWeight: '700', fontSize: 14, color: 'var(--text-heading)' }}>Customize Dashboard Widgets</h4>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Show/Hide or reorder cards below</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {widgets.map((w, idx) => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-main)', padding: '6px 12px', borderRadius: 20, borderWidth: 1, borderColor: 'var(--border-color)' }}>
              <span style={{ fontSize: 12, fontWeight: '600', color: 'var(--text-main)' }}>{w.label}</span>
              <input type="checkbox" checked={w.visible} onChange={() => handleToggleWidget(w.id)} />
              <button onClick={() => handleMoveWidgetUp(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} title="Move Up"><ChevronUp size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* KPI cards grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        {getWidget('sellers')?.visible && (
          <div style={{ flex: '1 1 200px', backgroundColor: '#fff', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: '600' }}>Active Sellers</span>
              <Users size={20} color="var(--color-primary)" />
            </div>
            <span style={{ fontSize: 28, fontWeight: '800', color: 'var(--text-heading)' }}>{kpis.totalSellers}</span>
          </div>
        )}
        {getWidget('buyers')?.visible && (
          <div style={{ flex: '1 1 200px', backgroundColor: '#fff', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: '600' }}>Active Buyers</span>
              <UserCheck size={20} color="var(--color-info)" />
            </div>
            <span style={{ fontSize: 28, fontWeight: '800', color: 'var(--text-heading)' }}>{kpis.totalBuyers}</span>
          </div>
        )}
        {getWidget('animals')?.visible && (
          <div style={{ flex: '1 1 200px', backgroundColor: '#fff', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: '600' }}>Listed Animals</span>
              <Layers size={20} color="var(--color-warning)" />
            </div>
            <span style={{ fontSize: 28, fontWeight: '800', color: 'var(--text-heading)' }}>{kpis.totalAnimals}</span>
          </div>
        )}
        {getWidget('pending')?.visible && (
          <div style={{ flex: '1 1 200px', backgroundColor: '#fff', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: '600' }}>Pending Approvals</span>
              <Clock size={20} color="var(--color-danger)" />
            </div>
            <span style={{ fontSize: 28, fontWeight: '800', color: 'var(--text-heading)' }}>{kpis.pendingApprovals}</span>
          </div>
        )}
      </div>

      {/* Charts section */}
      {getWidget('charts')?.visible && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ flex: '1 1 48%', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: '700' }}>Weekly Listed Animals</h3>
            <svg viewBox="0 0 400 200" style={{ width: '100%', height: 180 }}>
              <line x1="30" y1="30" x2="380" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="80" x2="380" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="130" x2="380" y2="130" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="170" x2="380" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
              {weeklyStats.map((bar, idx) => {
                const barHeight = (bar.value / 180) * 140;
                const xCoordinate = 50 + idx * 50;
                return (
                  <g key={idx}>
                    <rect
                      x={xCoordinate}
                      y={170 - barHeight}
                      width="24"
                      height={barHeight}
                      fill="var(--color-primary)"
                      rx="3"
                      style={{ transition: 'fill 0.2s', cursor: 'pointer' }}
                    />
                    <text x={xCoordinate + 12} y="190" textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontWeight="600">{bar.day}</text>
                    <text x={xCoordinate + 12} y={160 - barHeight} textAnchor="middle" fontSize="10" fill="var(--text-heading)" fontWeight="700">{bar.value}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div style={{ flex: '1 1 48%', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: '700' }}>Category Distribution</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 180 }}>
              <svg width="140" height="140" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="4" />
                {/* Dynamically draw overlays for segments */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-primary)" strokeWidth="4" strokeDasharray={`${((distribution.Cow || 0)/totalDistCount)*100} ${100 - (((distribution.Cow || 0)/totalDistCount)*100)}`} strokeDashoffset="25" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-info)" strokeWidth="4" strokeDasharray={`${((distribution.Buffalo || 0)/totalDistCount)*100} ${100 - (((distribution.Buffalo || 0)/totalDistCount)*100)}`} strokeDashoffset="75" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-warning)" strokeWidth="4" strokeDasharray={`${((distribution.Goat || 0)/totalDistCount)*100} ${100 - (((distribution.Goat || 0)/totalDistCount)*100)}`} strokeDashoffset="5" />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, backgroundColor: 'var(--color-primary)', borderRadius: '50%' }} /> <span style={{ fontSize: 12, fontWeight: '600' }}>Cows ({Math.round(((distribution.Cow || 0)/totalDistCount)*100)}%)</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, backgroundColor: 'var(--color-info)', borderRadius: '50%' }} /> <span style={{ fontSize: 12, fontWeight: '600' }}>Buffalos ({Math.round(((distribution.Buffalo || 0)/totalDistCount)*100)}%)</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 12, height: 12, backgroundColor: 'var(--color-warning)', borderRadius: '50%' }} /> <span style={{ fontSize: 12, fontWeight: '600' }}>Goats ({Math.round(((distribution.Goat || 0)/totalDistCount)*100)}%)</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Timeline Widget */}
      {getWidget('timeline')?.visible && (
        <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: '700' }}>Latest Activity Timeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {auditLogs.slice(0, 5).map((log, idx) => (
              <div key={log.id} style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: idx === 0 ? 'var(--color-primary)' : 'var(--border-color)' }} />
                  {idx < 4 && <div style={{ width: 2, flex: 1, backgroundColor: 'var(--border-color)', marginVertical: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-heading)', fontWeight: '700' }}>{log.action}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>{log.adminName} • {log.dateTime} • IP: {log.ipAddress}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
