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
            <div key={i} style={{ display: 'flex', gap: 20, backgroundColor: '#fff', padding: 24, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div className="skeleton" style={{ width: 200, height: 160, borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="skeleton" style={{ height: 20, width: '40%' }} />
                <div className="skeleton" style={{ height: 14, width: '80%' }} />
                <div className="skeleton" style={{ height: 14, width: '60%' }} />
                <div className="skeleton" style={{ height: 36, width: 200, marginTop: 'auto' }} />
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
      <div style={{ padding: 40, textAlign: 'center', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 520, margin: '40px auto' }}>
        <AlertCircle size={48} color="var(--color-danger)" />
        <h3 style={{ margin: 0, fontWeight: '800', fontSize: 18, color: 'var(--text-heading)' }}>Connection Error</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Failed to fetch pending approval listings. Check backend connection.</p>
        <p style={{ color: 'var(--color-danger)', fontSize: 12, margin: 0, fontFamily: 'monospace' }}>{apiError}</p>
        <button
          onClick={loadDashboardData}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', backgroundColor: 'var(--bg-sidebar)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '700', fontSize: 14 }}
        >
          <RefreshCw size={16} />
          <span>Retry Connection</span>
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
    <div style={{ animation: 'fadeIn 0.25s' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h2 style={{ fontSize: 24, fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>Approval Queue</h2>
            {pendingAnimals.length > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 28, height: 28, borderRadius: 14,
                backgroundColor: '#fef3c7', color: '#92400e',
                fontSize: 12, fontWeight: '800', padding: '0 8px'
              }}>
                {pendingAnimals.length}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            Review livestock submissions before publishing to the buyer marketplace.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={isLoading || isActionLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', backgroundColor: '#fff',
            border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
            cursor: (isLoading || isActionLoading) ? 'not-allowed' : 'pointer',
            fontWeight: '700', fontSize: 13, color: 'var(--text-main)',
            opacity: (isLoading || isActionLoading) ? 0.6 : 1
          }}
        >
          <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: '16px 20px', border: '1px solid var(--border-color)', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search input */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by animal, breed, seller, village…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', height: 40, paddingLeft: 38, paddingRight: 12, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', outline: 'none', fontSize: 13, color: 'var(--text-main)', backgroundColor: 'var(--bg-main)' }}
            />
          </div>

          {/* Category select */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            style={{ height: 40, padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-main)', outline: 'none', fontSize: 13, minWidth: 150 }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</option>
            ))}
          </select>

          {/* District filter */}
          <input
            type="text"
            placeholder="Filter by District"
            value={selectedDistrict}
            onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }}
            style={{ height: 40, padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', outline: 'none', fontSize: 13, minWidth: 150, backgroundColor: 'var(--bg-main)' }}
          />

          {/* Clear button */}
          {(searchQuery || selectedCategory || selectedDistrict) && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedDistrict(''); setCurrentPage(1); }}
              style={{ height: 40, padding: '0 16px', border: '1px solid var(--border-color)', backgroundColor: '#fff', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: '600' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Active filter summary */}
        {totalItems !== pendingAnimals.length && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            Showing <strong>{totalItems}</strong> of <strong>{pendingAnimals.length}</strong> pending listings
          </p>
        )}
      </div>

      {/* Empty state */}
      {paginatedListings.length === 0 ? (
        <div style={{ padding: 56, textAlign: 'center', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <CheckCircle2 size={52} color="var(--color-primary)" strokeWidth={1.5} />
          <h3 style={{ margin: 0, fontWeight: '800', fontSize: 18, color: 'var(--text-heading)' }}>
            {pendingAnimals.length === 0 ? 'No Pending Approvals' : 'No Results Match Your Filters'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, maxWidth: 360 }}>
            {pendingAnimals.length === 0
              ? 'All animal listings have been reviewed and released to the marketplace.'
              : 'Try clearing the filters to see all pending submissions.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {paginatedListings.map((animal) => (
            <div
              key={animal.id}
              style={{
                display: 'flex', gap: 0, backgroundColor: '#fff',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
                transition: 'box-shadow 0.2s'
              }}
            >
              {/* Left: Media column */}
              <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', borderRight: '1px solid var(--border-color)' }}>
                {/* Primary Photo */}
                <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
                  {animal.photos && animal.photos.length > 0 ? (
                    <img
                      src={animal.photos[0]}
                      alt={animal.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                    <span>No Photo</span>
                  </div>
                  {/* Photo count badge */}
                  {animal.photos && animal.photos.length > 1 && (
                    <span style={{
                      position: 'absolute', bottom: 8, right: 8,
                      backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
                      fontSize: 10, fontWeight: '700', padding: '2px 7px',
                      borderRadius: 10
                    }}>
                      +{animal.photos.length - 1} photos
                    </span>
                  )}
                </div>

                {/* Video indicator */}
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {animal.video ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', backgroundColor: '#dcfce7', borderRadius: 6 }}>
                      <Clock size={12} color="var(--color-primary)" />
                      <span style={{ fontSize: 11, fontWeight: '700', color: 'var(--color-primary)' }}>Video Attached</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', backgroundColor: '#fee2e2', borderRadius: 6 }}>
                      <AlertCircle size={12} color="var(--color-danger)" />
                      <span style={{ fontSize: 11, fontWeight: '700', color: 'var(--color-danger)' }}>No Video</span>
                    </div>
                  )}
                  {/* Pending Since */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={11} color="var(--text-muted)" />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: '600' }}>
                      {pendingSince(animal.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Info column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px' }}>
                {/* Top metadata row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {/* Animal ID */}
                    <span style={{
                      fontSize: 10, fontWeight: '700', fontFamily: 'monospace',
                      padding: '2px 8px', backgroundColor: '#f1f5f9', color: 'var(--text-muted)',
                      borderRadius: 4, border: '1px solid var(--border-color)'
                    }}>
                      ID: {truncateId(animal.id)}
                    </span>
                    {/* Category badge */}
                    {animal.categoryName && (
                      <span style={{
                        fontSize: 10, fontWeight: '700', padding: '2px 8px',
                        backgroundColor: 'var(--color-info-light)', color: 'var(--color-info)',
                        borderRadius: 4
                      }}>
                        {animal.categoryName}
                      </span>
                    )}
                    {/* Breed badge */}
                    {animal.breedName && (
                      <span style={{
                        fontSize: 10, fontWeight: '700', padding: '2px 8px',
                        backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
                        borderRadius: 4
                      }}>
                        {animal.breedName}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 20, fontWeight: '900', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                    ₹{(animal.price || 0).toLocaleString('en-IN')}
                    {animal.negotiable && <span style={{ fontSize: 11, fontWeight: '600', color: 'var(--text-muted)', marginLeft: 4 }}>(Negotiable)</span>}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.3 }}>
                  {animal.title}
                </h3>

                {/* Description */}
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {animal.description || 'No description provided.'}
                </p>

                {/* Health chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {animal.health?.milkCapacity && (
                    <span style={{ padding: '3px 10px', backgroundColor: 'var(--color-info-light)', color: 'var(--color-info)', borderRadius: 20, fontSize: 11, fontWeight: '700' }}>
                      Yield: {animal.health.milkCapacity}
                    </span>
                  )}
                  <span style={{ padding: '3px 10px', backgroundColor: animal.health?.vaccinated ? '#dcfce7' : '#f1f5f9', color: animal.health?.vaccinated ? '#166534' : 'var(--text-muted)', borderRadius: 20, fontSize: 11, fontWeight: '700' }}>
                    {animal.health?.vaccinated ? '✓ Vaccinated' : '✗ Not Vaccinated'}
                  </span>
                  {animal.health?.pregnant && (
                    <span style={{ padding: '3px 10px', backgroundColor: 'var(--color-warning-light)', color: '#92400e', borderRadius: 20, fontSize: 11, fontWeight: '700' }}>
                      Pregnant
                    </span>
                  )}
                  {animal.age && (
                    <span style={{ padding: '3px 10px', backgroundColor: '#f1f5f9', color: 'var(--text-main)', borderRadius: 20, fontSize: 11, fontWeight: '700' }}>
                      Age: {animal.age}
                    </span>
                  )}
                </div>

                {/* Seller & location footer */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <User size={12} />
                    <strong style={{ color: 'var(--text-main)' }}>{animal.sellerName}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={12} />
                    {[animal.village, animal.district, animal.state].filter(Boolean).join(', ') || 'Location not specified'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={12} />
                    Submitted: {formatDate(animal.createdAt)}
                  </span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 'auto' }}>
                  <button
                    onClick={() => setDetailsModal({ visible: true, data: animal })}
                    disabled={isActionLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)', color: 'var(--text-main)',
                      borderRadius: 'var(--radius-sm)', cursor: isActionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: '700', fontSize: 13, opacity: isActionLoading ? 0.6 : 1
                    }}
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => setRejectionModal({ visible: true, data: animal, reason: '' })}
                    disabled={isActionLoading}
                    style={{
                      padding: '8px 16px', backgroundColor: '#fff',
                      color: 'var(--color-danger)', border: '1px solid var(--color-danger)',
                      borderRadius: 'var(--radius-sm)', cursor: isActionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: '700', fontSize: 13, opacity: isActionLoading ? 0.6 : 1
                    }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => triggerConfirm(
                      'Approve', animal,
                      `Approve and publish "${animal.title}" to the live buyer marketplace?`,
                      () => handleApproveListing(animal)
                    )}
                    disabled={isActionLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 20px', backgroundColor: 'var(--color-primary)',
                      color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                      cursor: isActionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: '700', fontSize: 13, opacity: isActionLoading ? 0.6 : 1
                    }}
                  >
                    {isActionLoading
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
                      : <><CheckCircle2 size={14} /> Approve & Publish</>
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> — {totalItems} pending
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: currentPage === 1 ? '#f1f5f9' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
