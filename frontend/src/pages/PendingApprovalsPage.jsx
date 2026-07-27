import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import {
  Search, RefreshCw, AlertCircle, Eye, CheckCircle2,
  ChevronLeft, ChevronRight
} from 'lucide-react';

// Format a date string as "DD MMM YYYY, HH:MM"
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

export default function PendingApprovalsPage() {
  const {
    animals,
    isLoading,
    isActionLoading,
    apiError,
    loadDashboardData,
    setDetailsModal,
    setRejectionModal,
    triggerConfirm,
    handleApproveListing
  } = useContext(AdminContext);

  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Loading skeleton
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.2s' }}>
        <div className="skeleton" style={{ height: 32, width: 260, marginBottom: 4 }} />
        <div className="skeleton" style={{ height: 14, width: 420 }} />
        <div className="skeleton" style={{ height: 200, width: '100%', marginTop: 20 }} />
      </div>
    );
  }

  // 2. Connection error
  if (apiError) {
    return (
      <div 
        className="card" 
        style={{ 
          padding: '48px 32px', 
          textAlign: 'center', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 16, 
          maxWidth: 520, 
          margin: '40px auto' 
        }}
        role="alert"
        aria-live="assertive"
      >
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--color-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={28} color="var(--color-danger)" />
        </div>
        <div>
          <h3 style={{ margin: '0 0 6px', fontWeight: '800', fontSize: 18, color: 'var(--text-heading)' }}>Connection Error</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0 }}>Failed to fetch pending approval listings. Check backend connection.</p>
          <p style={{ color: 'var(--color-danger)', fontSize: 12, margin: '8px 0 0', fontFamily: 'monospace', backgroundColor: 'var(--color-danger-light)', padding: '6px 12px', borderRadius: 'var(--radius-xs)' }}>{apiError}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={loadDashboardData}
          style={{ marginTop: 8 }}
        >
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  // 3. Filter by status
  const pendingAnimals = animals.filter((a) => a.status === 'pending' && !a.isDeleted);
  const approvedAnimals = animals.filter((a) => a.status === 'approved' && !a.isDeleted);
  const rejectedAnimals = animals.filter((a) => a.status === 'rejected' && !a.isDeleted);

  const currentDataset =
    activeTab === 'pending'
      ? pendingAnimals
      : activeTab === 'approved'
      ? approvedAnimals
      : rejectedAnimals;

  // 4. Apply search (ID, title/animal, breed, seller, village, district)
  const filteredListings = currentDataset.filter((animal) => {
    const q = searchQuery.toLowerCase().trim();
    if (q === '') return true;

    return (
      (animal.id || '').toLowerCase().includes(q) ||
      (animal.title || '').toLowerCase().includes(q) ||
      (animal.breedName || '').toLowerCase().includes(q) ||
      (animal.sellerName || '').toLowerCase().includes(q) ||
      (animal.village || '').toLowerCase().includes(q) ||
      (animal.district || '').toLowerCase().includes(q)
    );
  });

  const totalItems = filteredListings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getEmptyStateText = () => {
    if (activeTab === 'pending') return 'No Pending Animals';
    if (activeTab === 'approved') return 'No Approved Animals';
    return 'No Rejected Animals';
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Approval Queue</h2>
          <p className="page-subtitle">
            Review livestock submissions before publishing to the live buyer marketplace.
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={loadDashboardData}
          disabled={isLoading || isActionLoading}
          aria-label="Refresh approval queue"
        >
          <RefreshCw 
            size={14} 
            style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} 
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
        <button
          className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
        >
          Pending ({pendingAnimals.length})
        </button>
        <button
          className={`btn ${activeTab === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
        >
          Approved ({approvedAnimals.length})
        </button>
        <button
          className={`btn ${activeTab === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('rejected'); setCurrentPage(1); }}
        >
          Rejected ({rejectedAnimals.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input input-search"
            style={{ paddingLeft: 34 }}
            type="text"
            placeholder="Search by ID, breed, seller, village, district…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Content / Table */}
      {paginatedListings.length === 0 ? (
        <div className="card-flat" style={{ padding: 56, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={32} color="var(--color-primary)" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px', fontWeight: '800', fontSize: 18, color: 'var(--text-heading)' }}>
              {getEmptyStateText()}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0, maxWidth: 360 }}>
              {searchQuery ? 'Try adjusting your search query or clearing the filter.' : 'No listings found in this section.'}
            </p>
          </div>
          {searchQuery && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>
              Reset Search
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="resizable-table">
            <thead>
              {activeTab === 'pending' && (
                <tr>
                  <th>Animal</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Created Date</th>
                  <th style={{ width: 280, textAlign: 'center' }}>Actions</th>
                </tr>
              )}
              {activeTab === 'approved' && (
                <tr>
                  <th>Animal</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Approved Date</th>
                  <th>Approved By</th>
                </tr>
              )}
              {activeTab === 'rejected' && (
                <tr>
                  <th>Animal</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Rejected Date</th>
                  <th>Rejection Reason</th>
                  <th>Rejected By</th>
                </tr>
              )}
            </thead>
            <tbody>
              {paginatedListings.map((a) => (
                <tr key={a.id}>
                  {/* Animal cell */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {a.photos?.[0] ? (
                        <img src={a.photos[0]} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: '#f1f5f9' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-heading)' }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {a.id.slice(-6)} | {a.breedName || 'N/A'}</div>
                      </div>
                    </div>
                  </td>

                  {/* Seller cell */}
                  <td>
                    <div>{a.sellerName || 'N/A'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.village}, {a.district}</div>
                  </td>

                  {/* Price cell */}
                  <td>
                    <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>₹{a.price?.toLocaleString('en-IN')}</span>
                  </td>

                  {/* Date & specific info cells */}
                  {activeTab === 'pending' && (
                    <>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(a.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDetailsModal({ visible: true, data: a })}
                            disabled={isActionLoading}
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                          <button
                            className="btn btn-danger-soft btn-sm"
                            onClick={() => setRejectionModal({ visible: true, data: a, reason: '' })}
                            disabled={isActionLoading}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => triggerConfirm(
                              'Approve', a,
                              `Approve and publish "${a.title}" to the live buyer marketplace?`,
                              () => handleApproveListing(a)
                            )}
                            disabled={isActionLoading}
                          >
                            Approve
                          </button>
                        </div>
                      </td>
                    </>
                  )}

                  {activeTab === 'approved' && (
                    <>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(a.approvedAt || a.updatedAt)}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{a.approvedBy?.name || (a.approvedBy ? 'Admin' : 'N/A')}</td>
                    </>
                  )}

                  {activeTab === 'rejected' && (
                    <>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(a.rejectedAt || a.updatedAt)}</td>
                      <td style={{ fontSize: 13, color: 'var(--color-danger)', fontWeight: '600' }}>{a.rejectionReason || 'No reason specified'}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{a.rejectedBy?.name || (a.rejectedBy ? 'Admin' : 'N/A')}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card-flat" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> — {totalItems} listings
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              aria-label="Go to previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              aria-label="Go to next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
