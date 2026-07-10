import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import {
  Clock, Search, RefreshCw, AlertCircle, Eye, CheckCircle2,
  ChevronLeft, ChevronRight, Tag, MapPin, User, Calendar, Loader2
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

// Calculate "Pending Since" relative time
const pendingSince = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

// Truncate Animal ID for display
const truncateId = (id) => {
  if (!id || id.length < 8) return id || 'N/A';
  return `${id.slice(0, 8)}…`;
};

export default function PendingApprovalsPage() {
  const {
    animals,
    categories,
    isLoading,
    isActionLoading,
    apiError,
    loadDashboardData,
    setDetailsModal,
    setRejectionModal,
    triggerConfirm,
    handleApproveListing
  } = useContext(AdminContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. Loading skeleton
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.2s' }}>
        <div className="skeleton" style={{ height: 32, width: 260, marginBottom: 4 }} />
        <div className="skeleton" style={{ height: 14, width: 420 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" style={{ display: 'flex', gap: 20, padding: 24 }}>
              <div className="skeleton" style={{ width: 220, height: 160, borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="skeleton skeleton-title" style={{ width: '45%' }} />
                <div className="skeleton skeleton-text" style={{ width: '85%' }} />
                <div className="skeleton skeleton-text" style={{ width: '65%' }} />
                <div style={{ display: 'flex', gap: 10, marginTop: 'auto', alignSelf: 'flex-end' }}>
                  <div className="skeleton skeleton-btn" />
                  <div className="skeleton skeleton-btn" />
                  <div className="skeleton skeleton-btn" style={{ width: 140 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
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

  // 3. Filter pending only
  const pendingAnimals = animals.filter((a) => a.status === 'pending' && !a.isDeleted);

  // 4. Apply search/filters
  const filteredListings = pendingAnimals.filter((animal) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      (animal.title || '').toLowerCase().includes(q) ||
      (animal.sellerName || '').toLowerCase().includes(q) ||
      (animal.village || '').toLowerCase().includes(q) ||
      (animal.categoryName || '').toLowerCase().includes(q) ||
      (animal.breedName || '').toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === '' || animal.categoryId === selectedCategory;

    const matchesDistrict =
      selectedDistrict.trim() === '' ||
      (animal.district || '').toLowerCase().includes(selectedDistrict.toLowerCase());

    return matchesSearch && matchesCategory && matchesDistrict;
  });

  const totalItems = filteredListings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 className="page-title">Approval Queue</h2>
            {pendingAnimals.length > 0 && (
              <span className="badge badge-pending" style={{ fontSize: 12, padding: '3px 8px' }}>
                {pendingAnimals.length} pending
              </span>
            )}
          </div>
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

      {/* Search & Filter Bar */}
      <div className="filter-bar">
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input input-search"
            style={{ paddingLeft: 34 }}
            placeholder="Search by animal, breed, seller, village…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* Category Select */}
        <select
          className="input"
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
          style={{ width: 180 }}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</option>
          ))}
        </select>

        {/* District Filter */}
        <input
          type="text"
          className="input"
          placeholder="Filter by District"
          value={selectedDistrict}
          onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }}
          style={{ width: 160 }}
          aria-label="Filter by district"
        />

        {/* Clear Button */}
        {(searchQuery || selectedCategory || selectedDistrict) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedDistrict(''); setCurrentPage(1); }}
            style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            aria-label="Clear active filters"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filter Summary */}
      {totalItems !== pendingAnimals.length && (
        <p style={{ margin: '-10px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
          Showing <strong>{totalItems}</strong> of <strong>{pendingAnimals.length}</strong> pending listings
        </p>
      )}

      {/* Empty State / Grid Items */}
      {paginatedListings.length === 0 ? (
        <div className="card-flat" style={{ padding: 56, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={32} color="var(--color-primary)" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px', fontWeight: '800', fontSize: 18, color: 'var(--text-heading)' }}>
              {pendingAnimals.length === 0 ? 'No Pending Approvals' : 'No Results Match Your Filters'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0, maxWidth: 360 }}>
              {pendingAnimals.length === 0
                ? 'All animal listings have been reviewed and released to the marketplace.'
                : 'Try adjusting your search criteria or clearing filters to locate submissions.'}
            </p>
          </div>
          {(searchQuery || selectedCategory || selectedDistrict) && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedDistrict(''); setCurrentPage(1); }}>
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {paginatedListings.map((animal, idx) => (
            <div
              key={animal.id}
              className="card"
              style={{
                display: 'flex',
                gap: 0,
                overflow: 'hidden',
                animation: `slideUp 0.2s ${Math.min(idx, 4) * 0.05}s both`,
                flexWrap: 'wrap'
              }}
            >
              {/* Left: Media column */}
              <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)', borderRight: '1px solid var(--border-color)', position: 'relative' }}>
                {/* Primary Photo */}
                <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden', backgroundColor: 'var(--border-color)' }}>
                  {animal.photos && animal.photos.length > 0 ? (
                    <img
                      src={animal.photos[0]}
                      alt={animal.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    display: animal.photos && animal.photos.length > 0 ? 'none' : 'flex',
                    width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 8, color: 'var(--text-muted)', fontSize: 12
                  }}>
                    <Tag size={28} strokeWidth={1.5} />
                    <span>No Photo Attached</span>
                  </div>
                  {/* Photo count badge */}
                  {animal.photos && animal.photos.length > 1 && (
                    <span style={{
                      position: 'absolute', bottom: 8, right: 8,
                      backgroundColor: 'rgba(15, 23, 42, 0.75)', color: '#fff',
                      fontSize: 10, fontWeight: '700', padding: '3px 8px',
                      borderRadius: 'var(--radius-full)', backdropFilter: 'blur(2px)'
                    }}>
                      +{animal.photos.length - 1} photos
                    </span>
                  )}
                </div>

                {/* Video indicator */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'center' }}>
                  {animal.video ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--radius-sm)', justifyContent: 'center' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                      <span style={{ fontSize: 11, fontWeight: '700', color: 'var(--color-primary-hover)' }}>Video Attached</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', backgroundColor: 'var(--color-danger-light)', borderRadius: 'var(--radius-sm)', justifyContent: 'center' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-danger)' }} />
                      <span style={{ fontSize: 11, fontWeight: '700', color: 'var(--color-danger-hover)' }}>No Video</span>
                    </div>
                  )}
                  {/* Pending Since */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 2 }}>
                    <Calendar size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: '600' }}>
                      {pendingSince(animal.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Info column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px', minWidth: 320 }}>
                {/* Top metadata row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {/* Animal ID */}
                    <span style={{
                      fontSize: 10, fontWeight: '700', fontFamily: 'monospace',
                      padding: '2px 8px', backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)',
                      borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)'
                    }}>
                      ID: {truncateId(animal.id)}
                    </span>
                    {/* Category badge */}
                    {animal.categoryName && (
                      <span className="badge badge-info" style={{ borderRadius: 'var(--radius-xs)' }}>
                        {animal.categoryName}
                      </span>
                    )}
                    {/* Breed badge */}
                    {animal.breedName && (
                      <span className="badge badge-approved" style={{ borderRadius: 'var(--radius-xs)' }}>
                        {animal.breedName}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 20, fontWeight: '800', color: 'var(--color-primary-hover)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline' }}>
                    ₹{(animal.price || 0).toLocaleString('en-IN')}
                    {animal.negotiable && <span style={{ fontSize: 11, fontWeight: '500', color: 'var(--text-muted)', marginLeft: 4 }}>(Negotiable)</span>}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ margin: '0 0 8px', fontSize: 16.5, fontWeight: '700', color: 'var(--text-heading)', lineHeight: 1.3 }}>
                  {animal.title}
                </h3>

                {/* Description */}
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.55, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {animal.description || 'No description provided.'}
                </p>

                {/* Health chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {animal.health?.milkCapacity && (
                    <span className="badge badge-info">
                      Yield: {animal.health.milkCapacity} Liters
                    </span>
                  )}
                  <span className="badge" style={{
                    backgroundColor: animal.health?.vaccinated ? 'var(--color-success-light)' : '#f1f5f9',
                    color: animal.health?.vaccinated ? '#065f46' : 'var(--text-muted)'
                  }}>
                    {animal.health?.vaccinated ? '✓ Vaccinated' : '✗ Not Vaccinated'}
                  </span>
                  {animal.health?.pregnant && (
                    <span className="badge badge-pending">
                      Pregnant
                    </span>
                  )}
                  {animal.age && (
                    <span className="badge" style={{ backgroundColor: '#f1f5f9', color: 'var(--text-main)' }}>
                      Age: {animal.age}
                    </span>
                  )}
                </div>

                {/* Seller & location footer */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16, fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <User size={13} color="var(--text-light)" />
                    <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{animal.sellerName}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={13} color="var(--text-light)" />
                    <span>{[animal.village, animal.district, animal.state].filter(Boolean).join(', ') || 'Location not specified'}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={13} color="var(--text-light)" />
                    <span>Submitted: {formatDate(animal.createdAt)}</span>
                  </span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 'auto' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDetailsModal({ visible: true, data: animal })}
                    disabled={isActionLoading}
                    aria-label={`View listing details for ${animal.title}`}
                  >
                    <Eye size={13} />
                    <span>View Details</span>
                  </button>
                  <button
                    className="btn btn-danger-soft btn-sm"
                    onClick={() => setRejectionModal({ visible: true, data: animal, reason: '' })}
                    disabled={isActionLoading}
                    aria-label={`Reject listing for ${animal.title}`}
                  >
                    Reject
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => triggerConfirm(
                      'Approve', animal,
                      `Approve and publish "${animal.title}" to the live buyer marketplace?`,
                      () => handleApproveListing(animal)
                    )}
                    disabled={isActionLoading}
                    aria-label={`Approve and publish listing for ${animal.title}`}
                  >
                    {isActionLoading ? (
                      <><Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
                    ) : (
                      <><CheckCircle2 size={13} /> Approve & Publish</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-flat" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> — {totalItems} pending listings
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
      )}
    </div>
  );
}

