import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Ban, Unlock, Trash2, User, Eye, Edit2, Search, Filter, AlertCircle, RefreshCw, X, Check, Save, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SellersPage() {
  const {
    sellers,
    setSellers,
    handleToggleBlockSeller,
    triggerConfirm,
    handleSoftDeleteSeller,
    isLoading,
    apiError,
    loadDashboardData,
    showToast
  } = useContext(AdminContext);

  // Search & Filter state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Selected details modal seller
  const [selectedSeller, setSelectedSeller] = useState(null);

  // Edit details seller state
  const [editingSeller, setEditingSeller] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', village: '', district: '', state: '' });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 1. Loading Skeleton Layout
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.2s' }}>
        <div className="skeleton" style={{ height: 32, width: 280, marginBottom: 4 }} />
        <div className="skeleton" style={{ height: 14, width: 380 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" style={{ height: 240 }} />
          ))}
        </div>
      </div>
    );
  }

  // 2. Error Fallback Retry block
  if (apiError) {
    return (
      <div
        className="card"
        style={{ padding: '48px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 500, margin: '40px auto' }}
        role="alert"
        aria-live="assertive"
      >
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--color-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={28} color="var(--color-danger)" />
        </div>
        <div>
          <h3 style={{ margin: '0 0 6px', fontWeight: '800', fontSize: 18, color: 'var(--text-heading)' }}>Connection Error</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0 }}>Failed to fetch seller directory from backend.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={loadDashboardData}
          style={{ marginTop: 8 }}
        >
          <RefreshCw size={14} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // Filter listings
  const activeSellers = sellers.filter((s) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      s.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === '' || s.status === selectedStatus;
    const matchesDistrict = selectedDistrict === '' || s.district.toLowerCase().includes(selectedDistrict.toLowerCase());

    return matchesSearch && matchesStatus && matchesDistrict;
  });

  // Pagination calculation
  const totalItems = activeSellers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedSellers = activeSellers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const startEditSeller = (seller) => {
    setEditingSeller(seller);
    setEditForm({
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      village: seller.village,
      district: seller.district,
      state: seller.state || 'Maharashtra'
    });
  };

  const saveSellerDetails = () => {
    setSellers((prev) =>
      prev.map((s) => (s.id === editingSeller.id ? { ...s, ...editForm } : s))
    );
    showToast('Seller Details Updated Successfully!', 'success');
    setEditingSeller(null);
  };

  return (
    <div style={{ animation: 'fadeIn 0.22s both' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Sellers Directory</h2>
          <p className="page-subtitle">Manage and moderate active livestock sellers on PashuSetu.</p>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input input-search"
            style={{ paddingLeft: 34 }}
            type="text"
            placeholder="Name, email, phone, location…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <select
          className="input"
          style={{ maxWidth: 160 }}
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Blocked">Blocked</option>
        </select>
        <input
          className="input"
          style={{ maxWidth: 160 }}
          type="text"
          placeholder="Filter by district"
          value={selectedDistrict}
          onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* Grid List */}
      {paginatedSellers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <User size={24} color="var(--text-muted)" />
          </div>
          <h3 style={{ margin: '0 0 6px', fontWeight: '700', fontSize: 16, color: 'var(--text-heading)' }}>No Sellers Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 24 }}>
          {paginatedSellers.map((seller, idx) => (
            <div key={seller.id} className="card" style={{ padding: '18px 20px', animation: `slideUp 0.18s ${Math.min(idx,5)*0.04}s both` }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <Image src={seller.photo} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: '800', color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seller.name}</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{seller.email}</span>
                </div>
                <span
                  className={`badge ${seller.status === 'Blocked' ? 'badge-rejected' : 'badge-approved'}`}
                  style={{ marginLeft: 'auto', flexShrink: 0 }}
                >
                  {seller.status}
                </span>
              </div>
              
              <div style={{ fontSize: 12, borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, color: 'var(--text-muted)' }}>
                <div><strong style={{ color: 'var(--text-main)' }}>Phone:</strong> {seller.phone}</div>
                <div><strong style={{ color: 'var(--text-main)' }}>Location:</strong> {[seller.village, seller.district].filter(Boolean).join(', ') || 'N/A'}</div>
                <div><strong style={{ color: 'var(--text-main)' }}>Listings:</strong> {seller.approvedListings || 0} approved</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setSelectedSeller(seller)}
                >
                  <Eye size={13} /> Profile
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => startEditSeller(seller)}
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  className={`btn btn-sm ${seller.status === 'Blocked' ? 'btn-secondary' : 'btn-danger-soft'}`}
                  onClick={() => {
                    const blockMsg = seller.status === 'Blocked'
                      ? `Unblock seller "${seller.name}"?`
                      : `Block seller "${seller.name}"? They will be denied login access.`;
                    triggerConfirm(seller.status === 'Blocked' ? 'Unblock' : 'Block', seller, blockMsg, () => handleToggleBlockSeller(seller));
                  }}
                >
                  {seller.status === 'Blocked' ? <Unlock size={13} /> : <Ban size={13} />}
                </button>
                <button
                  className="btn btn-danger-soft btn-sm btn-icon"
                  onClick={() => triggerConfirm('Delete Seller', seller, `Soft delete seller profile "${seller.name}"?`, () => handleSoftDeleteSeller(seller))}
                  aria-label={`Delete ${seller.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Strip */}
      {totalPages > 1 && (
        <div className="card-flat" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* View Profile Modal Overlay */}
      {selectedSeller && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: 480, backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <Image src={selectedSeller.photo} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: '800' }}>{selectedSeller.name}</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Registered Member</span>
                </div>
              </div>
              <button onClick={() => setSelectedSeller(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, borderTop: '1px solid var(--border-color)', paddingTop: 16, marginBottom: 24 }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Email Address:</span> <strong>{selectedSeller.email}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Mobile Number:</span> <strong>{selectedSeller.phone}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Village / Address:</span> <strong>{selectedSeller.village}, {selectedSeller.district}, {selectedSeller.state || 'Maharashtra'}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Profile Completion:</span> <strong style={{ color: 'var(--color-primary)' }}>100% Verified</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Total Submissions:</span> <strong>{selectedSeller.totalListings || 5} Listings</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedSeller(null)} style={{ padding: '8px 16px', backgroundColor: 'var(--bg-sidebar)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '700' }}>Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Seller Modal Overlay */}
      {editingSeller && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: 480, backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: '800' }}>Edit Seller Info</h3>
              <button onClick={() => setEditingSeller(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Full Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '100%', height: 38, padding: '0 10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email Address</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={{ width: '100%', height: 38, padding: '0 10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Phone / Mobile</label>
                <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} style={{ width: '100%', height: 38, padding: '0 10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Village</label>
                  <input type="text" value={editForm.village} onChange={(e) => setEditForm({ ...editForm, village: e.target.value })} style={{ width: '100%', height: 38, padding: '0 10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>District</label>
                  <input type="text" value={editForm.district} onChange={(e) => setEditForm({ ...editForm, district: e.target.value })} style={{ width: '100%', height: 38, padding: '0 10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setEditingSeller(null)} style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontWeight: '600' }}>Cancel</button>
              <button onClick={saveSellerDetails} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: 'var(--color-primary)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: '700' }}>
                <Save size={14} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Image({ src, style }) {
  const [error, setError] = React.useState(false);
  if (error || !src) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' }}>
        <User size={18} color="#64748b" />
      </div>
    );
  }
  return <img src={src} style={style} onError={() => setError(true)} alt="" />;
}
