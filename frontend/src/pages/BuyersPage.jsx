import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Ban, Unlock, Trash2, User, Eye, Edit2, Search, AlertCircle, RefreshCw, X, Save } from 'lucide-react';

export default function BuyersPage() {
  const {
    buyers,
    setBuyers,
    handleToggleBlockBuyer,
    handleTogglePremiumBuyer,
    triggerConfirm,
    handleSoftDeleteBuyer,
    isLoading,
    apiError,
    loadDashboardData,
    showToast
  } = useContext(AdminContext);

  // Search & Filter state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Selected details modal buyer
  const [selectedBuyer, setSelectedBuyer] = useState(null);

  // Edit details buyer state
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', village: '', district: '', state: '' });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 1. Loading Skeleton Layout
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.2s' }}>
        <div className="skeleton" style={{ height: 32, width: 220 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      </div>
    );
  }

  // 2. Error Fallback Retry block
  if (apiError) {
    return (
      <div className="error-state">
        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertCircle size={26} color="var(--color-danger)" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontWeight: '800', fontSize: 17, color: 'var(--text-heading)' }}>Connection Error</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.55 }}>
          Failed to fetch buyer directory from backend. Check connection.
        </p>
        <button className="btn btn-primary" onClick={loadDashboardData}>
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  // Filter listings
  const activeBuyers = buyers.filter((b) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery) ||
      b.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === '' || b.status === selectedStatus;
    const matchesDistrict = selectedDistrict === '' || b.district.toLowerCase().includes(selectedDistrict.toLowerCase());

    return matchesSearch && matchesStatus && matchesDistrict;
  });

  // Pagination calculation
  const totalItems = activeBuyers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedBuyers = activeBuyers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const startEditBuyer = (buyer) => {
    setEditingBuyer(buyer);
    setEditForm({
      name: buyer.name,
      email: buyer.email,
      phone: buyer.phone,
      village: buyer.village,
      district: buyer.district,
      state: buyer.state || 'Maharashtra'
    });
  };

  const saveBuyerDetails = () => {
    setBuyers((prev) =>
      prev.map((b) => (b.id === editingBuyer.id ? { ...b, ...editForm } : b))
    );
    showToast('Buyer Details Updated Successfully!', 'success');
    setEditingBuyer(null);
  };

  return (
    <div style={{ animation: 'fadeIn 0.22s both' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Buyers Directory</h2>
          <p className="page-subtitle">Manage and moderate active buyers registered in PashuSetu.</p>
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
      {paginatedBuyers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <User size={24} color="var(--text-muted)" />
          </div>
          <h3 style={{ margin: '0 0 6px', fontWeight: '700', fontSize: 16, color: 'var(--text-heading)' }}>No Buyers Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Try adjusting your search filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 24 }}>
          {paginatedBuyers.map((buyer, idx) => (
            <div key={buyer.id} className="card" style={{ padding: '18px 20px', animation: `slideUp 0.18s ${Math.min(idx,5)*0.04}s both` }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <Image src={buyer.photo} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: '800', color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{buyer.name}</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{buyer.email}</span>
                </div>
                {buyer.isPremium && (
                  <span
                    className="badge"
                    style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', fontWeight: '800', marginLeft: 'auto' }}
                  >
                    👑 Premium
                  </span>
                )}
                <span
                  className={`badge ${buyer.status === 'Blocked' ? 'badge-rejected' : 'badge-approved'}`}
                  style={{ marginLeft: buyer.isPremium ? 6 : 'auto', flexShrink: 0 }}
                >
                  {buyer.status}
                </span>
              </div>
              
              <div style={{ fontSize: 12, borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, color: 'var(--text-muted)' }}>
                <div><strong style={{ color: 'var(--text-main)' }}>Phone:</strong> {buyer.phone}</div>
                <div><strong style={{ color: 'var(--text-main)' }}>Location:</strong> {[buyer.village, buyer.district].filter(Boolean).join(', ') || 'N/A'}</div>
                <div><strong style={{ color: 'var(--text-main)' }}>Interests:</strong> {buyer.interestedListings || 0} animals</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setSelectedBuyer(buyer)}
                >
                  <Eye size={13} /> Profile
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => startEditBuyer(buyer)}
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  className={`btn btn-sm ${buyer.isPremium ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    backgroundColor: buyer.isPremium ? '#F59E0B' : undefined, 
                    color: buyer.isPremium ? '#FFFFFF' : undefined,
                    border: buyer.isPremium ? '1px solid #D97706' : undefined
                  }}
                  onClick={() => handleTogglePremiumBuyer(buyer)}
                  title="Toggle Premium Status"
                >
                  👑
                </button>
                <button
                  className={`btn btn-sm ${buyer.status === 'Blocked' ? 'btn-secondary' : 'btn-danger-soft'}`}
                  onClick={() => {
                    const blockMsg = buyer.status === 'Blocked' ? `Unblock buyer "${buyer.name}"?` : `Block buyer "${buyer.name}"? (They will be denied login access)`;
                    triggerConfirm(buyer.status === 'Blocked' ? 'Unblock' : 'Block', buyer, blockMsg, () => handleToggleBlockBuyer(buyer));
                  }}
                  aria-label={buyer.status === 'Blocked' ? 'Unblock buyer' : 'Block buyer'}
                >
                  {buyer.status === 'Blocked' ? <Unlock size={13} /> : <Ban size={13} />}
                </button>
                <button
                  className="btn btn-danger-soft btn-sm btn-icon"
                  onClick={() => triggerConfirm('Delete Buyer', buyer, `Soft delete buyer profile "${buyer.name}"?`, () => handleSoftDeleteBuyer(buyer))}
                  aria-label={`Delete ${buyer.name}`}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}><ChevronLeft size={14} /></button>
            <button className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {/* View Profile Modal Overlay */}
      {selectedBuyer && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSelectedBuyer(null); }}>
          <div className="modal-panel" style={{ width: 440, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Image src={selectedBuyer.photo} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: '800', color: 'var(--text-heading)' }}>{selectedBuyer.name}</h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: '600' }}>Registered Member</span>
                </div>
              </div>
              <button onClick={() => setSelectedBuyer(null)} className="btn-ghost btn-icon" style={{ padding: 4 }}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, borderTop: '1px solid var(--border-color)', paddingTop: 14, color: 'var(--text-main)' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Email Address:</span> <strong>{selectedBuyer.email || '—'}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Mobile Number:</span> <strong>{selectedBuyer.phone || '—'}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Village / Address:</span> <strong>{[selectedBuyer.village, selectedBuyer.district, selectedBuyer.state || 'Maharashtra'].filter(Boolean).join(', ')}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Profile Status:</span> <strong style={{ color: 'var(--color-primary)' }}>100% Verified</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Interested Listings:</span> <strong>{selectedBuyer.interestedListings || 0} Animals</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBuyer(null)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Buyer Modal Overlay */}
      {editingBuyer && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setEditingBuyer(null); }}>
          <div className="modal-panel" style={{ width: 440, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: '800', color: 'var(--text-heading)' }}>Edit Buyer Info</h3>
              <button onClick={() => setEditingBuyer(null)} className="btn-ghost btn-icon" style={{ padding: 4 }}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone / Mobile</label>
                <input type="text" className="input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Village</label>
                  <input type="text" className="input" value={editForm.village} onChange={(e) => setEditForm({ ...editForm, village: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">District</label>
                  <input type="text" className="input" value={editForm.district} onChange={(e) => setEditForm({ ...editForm, district: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button onClick={() => setEditingBuyer(null)} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={saveBuyerDetails} className="btn btn-primary btn-sm">
                <Save size={13} /> Save Changes
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
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
        <User size={16} color="#94a3b8" />
      </div>
    );
  }
  return <img src={src} style={style} onError={() => setError(true)} alt="" />;
}
