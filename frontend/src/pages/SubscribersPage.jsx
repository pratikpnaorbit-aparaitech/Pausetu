import React, { useState, useEffect, useCallback } from 'react';
import { getSubscribers } from '../api/subscriptionAdminApi';
import { useSubscriptionAutoRefresh } from '../hooks/useSubscriptionAutoRefresh';
import { Search, Filter, RefreshCw, Calendar, Clock, User, Phone, Mail } from 'lucide-react';

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1 });

  const fetchSubscribers = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const res = await getSubscribers({
        status: statusFilter,
        search,
        page,
        limit: 15
      });

      if (res && res.data && res.data.subscribers) {
        setSubscribers(res.data.subscribers);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      if (!isBackground) setError(err.response?.data?.message || 'Failed to load subscribers list');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchSubscribers(false);
  }, [fetchSubscribers]);

  useSubscriptionAutoRefresh(fetchSubscribers, { pageKey: 'SubscribersPage' });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSubscribers();
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="page-title" style={{ fontSize: 22, fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
            Subscribers Management
          </h2>
          <p className="page-subtitle" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
            Directory of active and expired subscribers with plan details, purchase/expiry timestamps, and days remaining
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchSubscribers} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh Directory
        </button>
      </div>

      {error && (
        <div style={{ padding: 14, backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#991b1b', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-flat" style={{ padding: 16, borderRadius: 12, backgroundColor: '#fff', border: '1px solid var(--border-color)', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 34, width: '100%', height: 38 }}
              placeholder="Search by subscriber name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">Search</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Filter size={14} color="#64748b" />
          <span style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>Filter Status:</span>
          <select
            className="input"
            style={{ height: 38, padding: '0 12px' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Subscribers</option>
            <option value="active">Active Members</option>
            <option value="expired">Expired Members</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="card-flat" style={{ padding: 20, borderRadius: 14, backgroundColor: '#fff', border: '1px solid var(--border-color)' }}>
        {loading ? (
          <div className="skeleton" style={{ height: 260, width: '100%' }} />
        ) : subscribers.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No subscriber records match the criteria.</p>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 11 }}>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Subscriber</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Contact Information</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Current Plan</th>
                  <th style={{ textAlign: 'center', padding: '10px' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Purchase Date</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Expiry Date</th>
                  <th style={{ textAlign: 'center', padding: '10px' }}>Days Remaining</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => {
                  const user = sub.userId || {};
                  const plan = sub.planId || {};
                  const isExpired = sub.computedStatus === 'expired';

                  return (
                    <tr key={sub._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ fontWeight: '700', color: '#0f172a', display: 'block' }}>
                          {user.name || user.fullName || 'User'}
                        </span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>ID: {user._id ? user._id.slice(-6) : '—'}</span>
                      </td>

                      <td style={{ padding: '12px 10px', fontSize: 12.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155' }}>
                          <Phone size={12} color="#64748b" /> {user.mobile || user.phoneNumber || 'N/A'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', marginTop: 2 }}>
                          <Mail size={12} color="#64748b" /> {user.email || 'N/A'}
                        </div>
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ fontWeight: '700', color: '#7c3aed', display: 'block' }}>{plan.name || 'Plan'}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>₹{sub.amount} ({plan.durationDays || '30'} Days)</span>
                      </td>

                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        {isExpired ? (
                          <span style={{ fontSize: 11, fontWeight: '800', backgroundColor: '#fff1f2', color: '#f43f5e', padding: '4px 10px', borderRadius: 12 }}>
                            EXPIRED
                          </span>
                        ) : sub.status === 'active' ? (
                          <span style={{ fontSize: 11, fontWeight: '800', backgroundColor: '#ecfdf5', color: '#10b981', padding: '4px 10px', borderRadius: 12 }}>
                            ACTIVE
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: '800', backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: 12 }}>
                            CANCELLED
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 10px', fontSize: 12, color: '#475569' }}>
                        {new Date(sub.startDate || sub.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ padding: '12px 10px', fontSize: 12, color: '#475569' }}>
                        {new Date(sub.endDate).toLocaleDateString()}
                      </td>

                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 13,
                          fontWeight: '900',
                          color: isExpired ? '#f43f5e' : '#10b981',
                          backgroundColor: isExpired ? '#fff1f2' : '#f0fdf4',
                          padding: '4px 10px',
                          borderRadius: 8
                        }}>
                          {sub.daysRemaining} Days
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
