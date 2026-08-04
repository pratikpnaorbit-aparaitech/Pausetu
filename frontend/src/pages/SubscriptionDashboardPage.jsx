import React, { useState, useEffect, useCallback } from 'react';
import { getSubscriptionDashboard } from '../api/subscriptionAdminApi';
import { useSubscriptionAutoRefresh } from '../hooks/useSubscriptionAutoRefresh';
import { DollarSign, Users, UserCheck, UserX, RefreshCw, CreditCard, ArrowUpRight } from 'lucide-react';

export default function SubscriptionDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const res = await getSubscriptionDashboard();
      if (res && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Error fetching subscription dashboard:', err);
      if (!isBackground) setError(err.response?.data?.message || 'Failed to load subscription dashboard data');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  useSubscriptionAutoRefresh(fetchDashboard, { pageKey: 'SubscriptionDashboardPage' });

  const kpis = dashboardData?.kpis || { totalRevenue: 0, activeSubscribers: 0, expiredSubscribers: 0, totalSubscribers: 0 };
  const recentTransactions = dashboardData?.recentTransactions || [];
  const planDistribution = dashboardData?.planDistribution || [];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="skeleton" style={{ height: 32, width: 260 }} />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ flex: '1 1 200px', height: 100, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="page-title" style={{ fontSize: 22, fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
            Subscription Dashboard
          </h2>
          <p className="page-subtitle" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
            Revenue analytics, subscriber KPIs, and real-time transaction logs
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchDashboard} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh Stats
        </button>
      </div>

      {error && (
        <div style={{ padding: 14, backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#991b1b', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        
        {/* Total Revenue */}
        <div className="card-flat" style={{ padding: 20, borderRadius: 14, backgroundColor: '#fff', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Revenue
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: '900', color: 'var(--text-heading)' }}>
            ₹{kpis.totalRevenue.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: 11, color: '#10b981', fontWeight: '600', display: 'inline-block', marginTop: 4 }}>
            Verified Razorpay Transactions
          </span>
        </div>

        {/* Active Subscribers */}
        <div className="card-flat" style={{ padding: 20, borderRadius: 14, backgroundColor: '#fff', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Subscribers
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={18} color="#22c55e" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: '900', color: 'var(--text-heading)' }}>
            {kpis.activeSubscribers}
          </div>
          <span style={{ fontSize: 11, color: '#22c55e', fontWeight: '600', display: 'inline-block', marginTop: 4 }}>
            Currently Active Premium Members
          </span>
        </div>

        {/* Expired Subscribers */}
        <div className="card-flat" style={{ padding: 20, borderRadius: 14, backgroundColor: '#fff', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Expired Memberships
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserX size={18} color="#f43f5e" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: '900', color: 'var(--text-heading)' }}>
            {kpis.expiredSubscribers}
          </div>
          <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: '600', display: 'inline-block', marginTop: 4 }}>
            Memberships Expired
          </span>
        </div>

        {/* Total Subscribers Lifetime */}
        <div className="card-flat" style={{ padding: 20, borderRadius: 14, backgroundColor: '#fff', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Unique Subscribers
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#a855f7" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: '900', color: 'var(--text-heading)' }}>
            {kpis.totalSubscribers}
          </div>
          <span style={{ fontSize: 11, color: '#a855f7', fontWeight: '600', display: 'inline-block', marginTop: 4 }}>
            Lifetime Paid Users
          </span>
        </div>

      </div>

      {/* Grid: Plan Distribution & Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* Active Plan Distribution */}
        <div className="card-flat" style={{ padding: 20, borderRadius: 14, backgroundColor: '#fff', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 15, fontWeight: '800', color: 'var(--text-heading)', margin: '0 0 16px 0' }}>
            Active Plan Breakdown
          </h3>

          {planDistribution.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No active plan data available yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {planDistribution.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', display: 'block' }}>{item.planName}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Type: {item.planType}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: '800', color: '#7c3aed', padding: '4px 10px', backgroundColor: '#f5f3ff', borderRadius: 20 }}>
                    {item.count} Subscriptions
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions Table */}
        <div className="card-flat" style={{ padding: 20, borderRadius: 14, backgroundColor: '#fff', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 15, fontWeight: '800', color: 'var(--text-heading)', margin: '0 0 16px 0' }}>
            Recent Paid Transactions
          </h3>

          {recentTransactions.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No transactions recorded yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 11 }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px' }}>User</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px' }}>Order ID</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px' }}>Amount</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontWeight: '600', color: '#0f172a', display: 'block' }}>
                          {tx.userId?.name || tx.userId?.email || 'User'}
                        </span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{tx.userId?.mobile || ''}</span>
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
                        {tx.razorpayOrderId}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>
                        ₹{tx.amount}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span className="badge badge-success" style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11 }}>
                          Captured
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
