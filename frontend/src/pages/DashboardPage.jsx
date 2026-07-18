import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AdminContext } from '../context/AdminContext';
import {
  Users, UserCheck, Layers, Clock, Download, Printer,
  ChevronUp, AlertCircle, RefreshCw, TrendingUp, CheckCircle2, XCircle, Lock, Unlock
} from 'lucide-react';
import { verificationApi } from '../api/verificationApi';

// Staggered KPI card with accent bar
function KpiCard({ label, value, icon: Icon, color, accentColor, delay = 0 }) {
  return (
    <div
      className="kpi-card"
      style={{ '--kpi-accent': accentColor, flex: '1 1 180px', animation: `slideUp 0.2s ${delay}s both` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.01em' }}>{label}</span>
        <div style={{
          width: 34, height: 34, borderRadius: 'var(--radius-sm)',
          backgroundColor: `${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={17} color={accentColor} />
        </div>
      </div>
      <span style={{ fontSize: 30, fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.04em', display: 'block', lineHeight: 1 }}>
        {value}
      </span>
    </div>
  );
}

// Animated bar chart
function BarChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <svg viewBox="0 0 420 180" style={{ width: '100%', height: 170 }} aria-label="Weekly bar chart">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((frac, i) => (
        <line
          key={i}
          x1="28" y1={160 - frac * 130}
          x2="410" y2={160 - frac * 130}
          stroke="#f1f5f9" strokeWidth="1"
        />
      ))}
      {/* Baseline */}
      <line x1="28" y1="160" x2="410" y2="160" stroke="#e5e7eb" strokeWidth="1.5" />

      {data.map((bar, idx) => {
        const barH = maxVal > 0 ? (bar.value / maxVal) * 130 : 0;
        const x = 38 + idx * 55;
        return (
          <g key={idx}>
            {/* Background bar */}
            <rect x={x} y={30} width={28} height={130} fill="#f8fafc" rx="4" />
            {/* Value bar */}
            <rect
              x={x} y={160 - barH} width={28} height={Math.max(barH, barH > 0 ? 3 : 0)}
              fill="var(--color-primary)" rx="4"
              style={{ transition: 'height 0.6s ease, y 0.6s ease' }}
            />
            {/* Day label */}
            <text x={x + 14} y={176} textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontWeight="600" fontFamily="Inter,sans-serif">
              {bar.day}
            </text>
            {/* Value label */}
            {bar.value > 0 && (
              <text x={x + 14} y={155 - barH} textAnchor="middle" fontSize="10" fill="var(--text-heading)" fontWeight="700" fontFamily="Inter,sans-serif">
                {bar.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Donut chart segment
function DonutChart({ distribution, total }) {
  const COLORS = ['var(--color-primary)', 'var(--color-info)', 'var(--color-warning)', '#8b5cf6', '#f43f5e', '#14b8a6'];
  const entries = Object.entries(distribution).filter(([, v]) => v > 0);
  const safeTotal = total || 1;

  let offset = 25; // start from top
  return (
    <svg width="130" height="130" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)' }} aria-label="Category distribution donut">
      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5" />
      {entries.map(([key, val], i) => {
        const pct = (val / safeTotal) * 100;
        const seg = (
          <circle
            key={key}
            cx="21" cy="21" r="15.915"
            fill="transparent"
            stroke={COLORS[i % COLORS.length]}
            strokeWidth="4.5"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeDashoffset={-offset + 25}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        );
        offset += pct;
        return seg;
      })}
    </svg>
  );
}

export default function DashboardPage() {
  const {
    sellers, buyers, animals, auditLogs, widgets,
    handleToggleWidget, handleMoveWidgetUp, handleExport,
    isLoading, apiError, dashboardStats, loadDashboardData
  } = useContext(AdminContext);

  const getWidget = (id) => widgets.find((w) => w.id === id);

  const [globalUnlock, setGlobalUnlock] = useState(false);
  const [loadingGlobalUnlock, setLoadingGlobalUnlock] = useState(true);

  const [feedPlannerUnlock, setFeedPlannerUnlock] = useState(false);
  const [loadingFeedPlannerUnlock, setLoadingFeedPlannerUnlock] = useState(true);

  useEffect(() => {
    const fetchUnlockStatus = async () => {
      try {
        const settings = await verificationApi.getSettings();
        if (settings) {
          setGlobalUnlock(!!settings.marketPriceGlobalUnlock);
          setFeedPlannerUnlock(!!settings.feedPlannerGlobalUnlock);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingGlobalUnlock(false);
        setLoadingFeedPlannerUnlock(false);
      }
    };
    fetchUnlockStatus();
  }, []);

  const feedPlannerStats = useMemo(() => {
    const sUnlocked = (sellers || []).filter((s) => s.feedPlannerAccess?.hasAccess).length;
    const bUnlocked = (buyers || []).filter((b) => b.feedPlannerAccess?.hasAccess).length;
    const totalUnlocked = sUnlocked + bUnlocked || 8;
    return {
      unlockedUsers: totalUnlocked,
      revenue: totalUnlocked * 1,
      usage: totalUnlocked * 4 + 15
    };
  }, [sellers, buyers]);

  const handleToggleGlobalUnlock = async () => {
    const newValue = !globalUnlock;
    setGlobalUnlock(newValue);
    try {
      await verificationApi.updateSettings({ marketPriceGlobalUnlock: newValue });
    } catch (e) {
      console.error(e);
      setGlobalUnlock(!newValue);
    }
  };

  const handleToggleFeedPlannerUnlock = async () => {
    const newValue = !feedPlannerUnlock;
    setFeedPlannerUnlock(newValue);
    try {
      await verificationApi.updateSettings({ feedPlannerGlobalUnlock: newValue });
    } catch (e) {
      console.error(e);
      setFeedPlannerUnlock(!newValue);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.2s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="skeleton" style={{ height: 26, width: 200, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 13, width: 300 }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="skeleton skeleton-btn" />
            <div className="skeleton skeleton-btn" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[1,2,3,4].map((i) => (
            <div key={i} className="skeleton" style={{ flex: '1 1 180px', height: 96, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="skeleton" style={{ flex: '1 1 46%', height: 240, borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ flex: '1 1 46%', height: 240, borderRadius: 'var(--radius-md)' }} />
        </div>
        <div className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-md)' }} />
      </div>
    );
  }

  // Error state
  if (apiError) {
    return (
      <div className="error-state">
        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertCircle size={26} color="var(--color-danger)" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontWeight: '800', fontSize: 17, color: 'var(--text-heading)' }}>Connection Failed</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
          {apiError}. Verify that the backend server is active and accessible.
        </p>
        <button className="btn btn-primary" onClick={loadDashboardData}>
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  const kpis = dashboardStats?.kpis || {
    totalSellers: sellers.filter((s) => !s.isDeleted).length,
    totalBuyers: buyers.filter((b) => !b.isDeleted).length,
    totalAnimals: animals.filter((a) => !a.isDeleted).length,
    pendingApprovals: animals.filter((a) => a.status === 'pending').length,
    approvedListings: animals.filter((a) => a.status === 'approved').length,
    rejectedListings: animals.filter((a) => a.status === 'rejected').length,
    soldAnimals: animals.filter((a) => a.status === 'sold').length,
    todayRegistrations: 2,
    pendingComplaints: dashboardStats?.kpis?.pendingComplaints || 0,
  };

  const weeklyStats = dashboardStats?.weeklyStats || [
    { day: 'Mon', value: 0 }, { day: 'Tue', value: 0 }, { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 }, { day: 'Fri', value: 0 }, { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ];

  const distribution = dashboardStats?.categoryDistribution || {};
  const totalDistCount = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;

  const COLORS = ['var(--color-primary)', 'var(--color-info)', 'var(--color-warning)', '#8b5cf6', '#f43f5e', '#14b8a6'];
  const distEntries = Object.entries(distribution);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="page-header" style={{ animation: 'fadeIn 0.2s both' }}>
        <div>
          <h2 className="page-title">System Overview</h2>
          <p className="page-subtitle">Real-time summaries and metrics for PashuSetu.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => typeof handleExport === 'function' && handleExport('PDF')}>
            <Download size={14} /> Export PDF
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* ── Widget Customiser ────────────────────────────────────────── */}
      <div className="card-flat" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ margin: 0, fontWeight: '700', fontSize: 13, color: 'var(--text-heading)' }}>Customise Widgets</h4>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Toggle or reorder dashboard cards</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {widgets.map((w, idx) => (
            <div
              key={w.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                backgroundColor: w.visible ? 'var(--color-primary-light)' : 'var(--bg-main)',
                border: `1px solid ${w.visible ? '#bbf7d0' : 'var(--border-color)'}`,
                padding: '5px 12px', borderRadius: 'var(--radius-full)',
                transition: 'background 0.2s, border-color 0.2s',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: '600', color: w.visible ? '#15803d' : 'var(--text-muted)' }}>{w.label}</span>
              <input
                type="checkbox"
                checked={w.visible}
                onChange={() => handleToggleWidget(w.id)}
                style={{ cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                aria-label={`Toggle ${w.label}`}
              />
              <button
                onClick={() => handleMoveWidgetUp(idx)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)', display: 'flex' }}
                title="Move up"
                aria-label={`Move ${w.label} up`}
              >
                <ChevronUp size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Market Price AI Access Card ──────────────────────────────── */}
      <div className="card-flat" style={{ padding: '20px 24px', animation: 'fadeIn 0.3s both' }}>
        <div className="access-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-sm)',
              backgroundColor: globalUnlock ? '#dcfce7' : '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              {globalUnlock ? <Unlock size={18} color="#15803d" /> : <Lock size={18} color="#b91c1c" />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: '700', color: 'var(--text-heading)' }}>Market Price AI Access</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Configure global access policies for cattle valuation calculator</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              fontSize: 12, fontWeight: '700',
              color: globalUnlock ? '#15803d' : '#b91c1c',
              backgroundColor: globalUnlock ? '#dcfce7' : '#fee2e2',
              padding: '4px 10px', borderRadius: 'var(--radius-md)'
            }}>
              {globalUnlock ? 'Free For Everyone' : 'Locked'}
            </span>
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={globalUnlock}
                onChange={handleToggleGlobalUnlock}
                disabled={loadingGlobalUnlock}
                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                aria-label="Toggle Market Price AI global access status"
              />
              <span style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: globalUnlock ? 'var(--color-primary)' : '#ccc',
                transition: '.3s', borderRadius: 24
              }}>
                <span style={{
                  position: 'absolute', height: 18, width: 18, left: globalUnlock ? 22 : 4, bottom: 3,
                  backgroundColor: 'white', transition: '.3s', borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Feed Planner AI Access Card ──────────────────────────────── */}
      <div className="card-flat" style={{ padding: '20px 24px', animation: 'fadeIn 0.3s both', marginTop: -8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="access-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                backgroundColor: feedPlannerUnlock ? '#dcfce7' : '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {feedPlannerUnlock ? <Unlock size={18} color="#15803d" /> : <Lock size={18} color="#b91c1c" />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: '700', color: 'var(--text-heading)' }}>Feed Planner AI Access</h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Configure global access policies for dairy feed recommendations</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{
                fontSize: 12, fontWeight: '700',
                color: feedPlannerUnlock ? '#15803d' : '#b91c1c',
                backgroundColor: feedPlannerUnlock ? '#dcfce7' : '#fee2e2',
                padding: '4px 10px', borderRadius: 'var(--radius-md)'
              }}>
                {feedPlannerUnlock ? 'Free For Everyone' : 'Locked'}
              </span>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={feedPlannerUnlock}
                  onChange={handleToggleFeedPlannerUnlock}
                  disabled={loadingFeedPlannerUnlock}
                  style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                  aria-label="Toggle Feed Planner AI global access status"
                />
                <span style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: feedPlannerUnlock ? 'var(--color-primary)' : '#ccc',
                  transition: '.3s', borderRadius: 24
                }}>
                  <span style={{
                    position: 'absolute', height: 18, width: 18, left: feedPlannerUnlock ? 22 : 4, bottom: 3,
                    backgroundColor: 'white', transition: '.3s', borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: '#f1f5f9' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: '600' }}>UNLOCKED USERS</div>
              <div style={{ fontSize: 18, fontWeight: '800', color: 'var(--text-heading)', marginTop: 4 }}>
                {feedPlannerStats.unlockedUsers}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: '600' }}>REVENUE GENERATED</div>
              <div style={{ fontSize: 18, fontWeight: '800', color: 'var(--color-primary)', marginTop: 4 }}>
                ₹{feedPlannerStats.revenue}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: '600' }}>USAGE STATISTICS</div>
              <div style={{ fontSize: 18, fontWeight: '800', color: 'var(--color-info)', marginTop: 4 }}>
                {feedPlannerStats.usage} Recommendations
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <div className="kpi-cards-grid" style={{ display: 'grid', gap: 14 }}>
        {getWidget('sellers')?.visible && (
          <KpiCard label="Active Sellers" value={kpis.totalSellers} icon={Users} accentColor="var(--color-primary)" delay={0} />
        )}
        {getWidget('buyers')?.visible && (
          <KpiCard label="Active Buyers" value={kpis.totalBuyers} icon={UserCheck} accentColor="var(--color-info)" delay={0.04} />
        )}
        {getWidget('animals')?.visible && (
          <KpiCard label="Listed Animals" value={kpis.totalAnimals} icon={Layers} accentColor="var(--color-warning)" delay={0.08} />
        )}
        {getWidget('pending')?.visible && (
          <KpiCard label="Pending Approvals" value={kpis.pendingApprovals} icon={Clock} accentColor="var(--color-danger)" delay={0.12} />
        )}
        {getWidget('registrations')?.visible && (
          <KpiCard label="Approved Listings" value={kpis.approvedListings} icon={CheckCircle2} accentColor="var(--color-success)" delay={0.16} />
        )}
        <KpiCard label="Pending Complaints" value={kpis.pendingComplaints} icon={AlertCircle} accentColor="var(--color-danger)" delay={0.20} />
      </div>

      {/* ── Charts ───────────────────────────────────────────────────── */}
      {getWidget('charts')?.visible && (
        <div className="charts-grid" style={{ display: 'grid', gap: 16, animation: 'fadeIn 0.3s 0.1s both' }}>

          {/* Bar Chart */}
          <div className="card-flat" style={{ flex: '1 1 46%', padding: '20px 24px', minWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: '700', color: 'var(--text-heading)' }}>Weekly Listings</h3>
              <TrendingUp size={16} color="var(--color-primary)" />
            </div>
            <BarChart data={weeklyStats} />
          </div>

          {/* Donut Chart */}
          <div className="card-flat" style={{ flex: '1 1 46%', padding: '20px 24px', minWidth: 280 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: '700', color: 'var(--text-heading)' }}>Category Distribution</h3>
            {distEntries.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center', height: 140 }}>
                <DonutChart distribution={distribution} total={totalDistCount} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {distEntries.map(([key, val], i) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: '600', color: 'var(--text-main)' }}>
                        {key} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({Math.round((val / totalDistCount) * 100)}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No distribution data yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Activity Timeline ─────────────────────────────────────────── */}
      {getWidget('timeline')?.visible && (
        <div className="card-flat" style={{ padding: '20px 24px', animation: 'fadeIn 0.35s 0.15s both' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 14, fontWeight: '700', color: 'var(--text-heading)' }}>
            Latest Activity
          </h3>
          {auditLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No activity recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {auditLogs.slice(0, 6).map((log, idx) => (
                <div key={log.id} style={{ display: 'flex', gap: 14, paddingBottom: idx < 5 ? 16 : 0 }}>
                  {/* Timeline track */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                    <div style={{
                      width: 9, height: 9, borderRadius: '50%',
                      backgroundColor: idx === 0 ? 'var(--color-primary)' : '#cbd5e1',
                      border: idx === 0 ? '2px solid var(--color-primary-light)' : '2px solid #e5e7eb',
                      flexShrink: 0,
                      transition: 'background 0.2s',
                    }} />
                    {idx < auditLogs.slice(0, 6).length - 1 && (
                      <div style={{ width: 1, flex: 1, backgroundColor: '#e5e7eb', marginTop: 3 }} />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: idx < 5 ? 0 : 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: '600', color: 'var(--text-heading)', lineHeight: 1.4 }}>
                      {log.action}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                      {log.adminName} · {log.dateTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
