import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Star,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  AlertCircle,
  TrendingUp,
  Download,
  Calendar,
} from 'lucide-react';
import { reviewApi } from '../api/reviewApi';
import { AdminContext } from '../context/AdminContext';

/**
 * StarRating Component — renders a 5-star visual rating display
 */
const StarRating = ({ rating = 0 }) => {
  const roundedRating = Number(rating) || 0;
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          fill={star <= roundedRating ? '#f59e0b' : 'none'}
          color={star <= roundedRating ? '#f59e0b' : '#cbd5e1'}
        />
      ))}
      <span style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', marginLeft: 4 }}>
        {roundedRating.toFixed(1)}
      </span>
    </div>
  );
};

/**
 * ReviewsPage — Enterprise Dashboard Component for App Review Monitoring & Management
 */
export default function ReviewsPage() {
  const { triggerConfirm } = useContext(AdminContext);

  // Core Data States
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviewsToday: 0,
    reviewsThisWeek: 0,
    reviewsThisMonth: 0,
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState('');

  /**
   * Fetch app reviews and analytics independently so an issue in stats does not block reviews list.
   * Supports optional background fetching to update UI without triggering full page spinner.
   */
  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setErrorMsg(null);

    const filters = {};
    if (ratingFilter !== 'all') filters.rating = ratingFilter;
    if (localSearch && localSearch.trim()) filters.search = localSearch.trim();

    // 1. Fetch Reviews List
    try {
      const reviewsRes = await reviewApi.getAdminReviews(filters);
      const extracted =
        reviewsRes?.data?.reviews ||
        reviewsRes?.data?.data?.reviews ||
        reviewsRes?.reviews ||
        (Array.isArray(reviewsRes?.data) ? reviewsRes.data : []) ||
        (Array.isArray(reviewsRes) ? reviewsRes : []);

      setReviews(Array.isArray(extracted) ? extracted : []);
    } catch (err) {
      if (!isBackground) {
        setErrorMsg('Failed to load reviews. Please check backend connection.');
      }
    }

    // 2. Fetch Review Stats
    try {
      const statsRes = await reviewApi.getAdminReviewStats();
      const statsObj =
        statsRes?.data?.stats ||
        statsRes?.data?.data?.stats ||
        statsRes?.stats ||
        statsRes?.data ||
        {};

      setStats({
        totalReviews: Number(statsObj.totalReviews) || 0,
        averageRating: Number(statsObj.averageRating) || 0,
        ratingDistribution: statsObj.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviewsToday: Number(statsObj.reviewsToday) || 0,
        reviewsThisWeek: Number(statsObj.reviewsThisWeek) || 0,
        reviewsThisMonth: Number(statsObj.reviewsThisMonth) || 0,
      });
    } catch (_) {
      // Retain existing stats gracefully if fetch fails
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, [ratingFilter, localSearch]);

  useEffect(() => {
    fetchData(false);

    // Auto-refresh polling every 30 seconds to fetch newly submitted mobile reviews
    const pollInterval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [fetchData]);

  /**
   * Export loaded reviews to a downloadable CSV file
   */
  const exportCSV = useCallback(() => {
    if (!reviews || reviews.length === 0) {
      alert('No reviews available to export.');
      return;
    }

    const headers = ['ID', 'User Name', 'Email', 'Rating', 'Feedback', 'Platform', 'App Version', 'Created At'];
    const rows = reviews.map((r) => [
      `"${r._id}"`,
      `"${(r.userName || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      r.rating,
      `"${(r.feedback || '').replace(/"/g, '""')}"`,
      `"${r.platform || 'android'}"`,
      `"${r.appVersion || '1.0.0'}"`,
      `"${new Date(r.createdAt).toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `app_reviews_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [reviews]);

  /**
   * Delete review handler
   */
  const handleDelete = useCallback((review) => {
    triggerConfirm(
      'Delete Review',
      review._id,
      'Are you sure you want to delete this review permanently?',
      async () => {
        try {
          await reviewApi.deleteAdminReview(review._id);
          fetchData();
        } catch (err) {
          alert(err.response?.data?.message || 'Failed to delete review');
        }
      }
    );
  }, [triggerConfirm, fetchData]);

  return (
    <div className="page-container" style={{ padding: 24, maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Star fill="#f59e0b" color="#f59e0b" size={26} />
            App Reviews & Ratings
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Internal monitoring dashboard for user reviews submitted from the PashuSetu mobile app.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={exportCSV}
            className="action-btn secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #cbd5e1' }}
          >
            <Download size={16} />
            Export CSV
          </button>

          <button
            onClick={() => fetchData(false)}
            className="action-btn primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, cursor: 'pointer' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Error Alert Notification Banner */}
      {errorMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} color="#dc2626" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Cards & Rating Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Card 1: Average Rating */}
        <div className="admin-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, backgroundColor: '#fff' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star fill="#d97706" color="#d97706" size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Rating</div>
            <div style={{ fontSize: 24, fontWeight: '800', color: '#0f172a', marginTop: 2 }}>
              {stats.averageRating ? `${stats.averageRating.toFixed(1)} / 5.0` : '0.0 / 5.0'}
            </div>
          </div>
        </div>

        {/* Card 2: Total Reviews */}
        <div className="admin-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, backgroundColor: '#fff' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp color="#2563eb" size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Reviews</div>
            <div style={{ fontSize: 24, fontWeight: '800', color: '#0f172a', marginTop: 2 }}>{stats.totalReviews}</div>
          </div>
        </div>

        {/* Card 3: Reviews Today */}
        <div className="admin-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, backgroundColor: '#fff' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar color="#16a34a" size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reviews Today</div>
            <div style={{ fontSize: 24, fontWeight: '800', color: '#16a34a', marginTop: 2 }}>{stats.reviewsToday}</div>
          </div>
        </div>

        {/* Card 4: Rating Breakdown */}
        <div className="admin-card" style={{ padding: 16, backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: 6, gridColumn: 'span 2' }}>
          <div style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Rating Breakdown
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: '600', color: '#334155' }}>
                <span>{stars}★</span>
                <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: '#f1f5f9', color: '#0f172a', fontSize: 12 }}>
                  {stats.ratingDistribution[stars] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="admin-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', backgroundColor: '#fff' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by user, email or feedback..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
          />
        </div>

        {/* Filter Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#64748b" />
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, backgroundColor: '#fff', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">All Stars</option>
            <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
            <option value="4">4 Stars ⭐⭐⭐⭐</option>
            <option value="3">3 Stars ⭐⭐⭐</option>
            <option value="2">2 Stars ⭐⭐</option>
            <option value="1">1 Star ⭐</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#fff' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: '700', color: '#475569' }}>User Details</th>
                <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: '700', color: '#475569' }}>Rating</th>
                <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: '700', color: '#475569' }}>Feedback / Message</th>
                <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: '700', color: '#475569' }}>Date</th>
                <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw className="spin" size={24} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <p>Loading reviews...</p>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
                    <AlertCircle size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <p style={{ fontWeight: '600', fontSize: 15 }}>No reviews found</p>
                    <p style={{ fontSize: 13, opacity: 0.8 }}>Try adjusting search or rating filters.</p>
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => (
                  <tr key={rev._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', fontSize: 14, color: '#0f172a' }}>{rev.userName || 'Anonymous'}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{rev.email || 'N/A'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{rev.platform || 'android'} • v{rev.appVersion || '1.0.0'}</div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <StarRating rating={rev.rating} />
                    </td>

                    <td style={{ padding: '14px 16px', maxWidth: 360 }}>
                      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.4 }}>
                        {rev.feedback ? rev.feedback : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No written feedback</span>}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b' }}>
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          title="Delete Review"
                          onClick={() => handleDelete(rev)}
                          style={{ padding: 6, borderRadius: 6, border: 'none', backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
