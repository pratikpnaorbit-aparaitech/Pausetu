import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Ban, Unlock, Trash2, User, Eye, Edit2, Search, Filter, AlertCircle, RefreshCw, X, Check, Save } from 'lucide-react';

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
        <div style={{ height: 40, width: 280, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 240, backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      </div>
    );
  }

  // 2. Error Fallback Retry block
  if (apiError) {
    return (
      <div style={{ padding: 40, textAlign: 'center', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 500, margin: '40px auto' }}>
        <AlertCircle size={48} color="var(--color-danger)" />
        <h3 style={{ margin: 0, fontWeight: '700', fontSize: 18, color: 'var(--text-heading)' }}>Connection Error</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Failed to fetch seller directory from backend.</p>
        <button
          onClick={loadDashboardData}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', backgroundColor: 'var(--bg-sidebar)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '700' }}
        >
          <RefreshCw size={16} />
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
    <div style={{ animation: 'fadeIn 0.25s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>Sellers Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Manage and block active animal sellers registered in PashuSetu.</p>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border-color)', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by Name, Email, Phone, Location..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', height: 38, paddingLeft: 40, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', outline: 'none', fontSize: 13 }}
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
          style={{ height: 38, padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', outline: 'none' }}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Blocked">Blocked</option>
        </select>

        <input
          type="text"
          placeholder="Filter by District"
          value={selectedDistrict}
          onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }}
          style={{ height: 38, padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
        />
      </div>

      {/* Grid List */}
      {paginatedSellers.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <User size={48} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <h3 style={{ margin: 0, fontWeight: '700' }}>No Sellers Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Try adjusting your search filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
          {paginatedSellers.map((seller) => (
            <div key={seller.id} style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 18, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                <Image src={seller.photo} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: '800', color: 'var(--text-heading)' }}>{seller.name}</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{seller.email}</span>
                </div>
              </div>
              
              <div style={{ fontSize: 13, borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> <strong>{seller.phone}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Location:</span> <strong>{seller.village}, {seller.district}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Approved Listings:</span> <strong>{seller.approvedListings || 0}</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: '700',
                    backgroundColor: seller.status === 'Blocked' ? 'var(--color-danger-light)' : 'var(--color-primary-light)',
                    color: seller.status === 'Blocked' ? 'var(--color-danger)' : 'var(--color-primary)'
                  }}>
                    {seller.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSelectedSeller(seller)}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: '700' }}
                >
                  <Eye size={14} />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => startEditSeller(seller)}
                  style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: '700' }}
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    const blockMsg = seller.status === 'Blocked' ? `Unblock seller "${seller.name}"?` : `Block seller "${seller.name}"? (They will be denied login access)`;
                    triggerConfirm(seller.status === 'Blocked' ? 'Unblock' : 'Block', seller, blockMsg, () => handleToggleBlockSeller(seller));
                  }}
                  style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', color: seller.status === 'Blocked' ? 'var(--color-primary)' : 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: '700' }}
                >
                  {seller.status === 'Blocked' ? <Unlock size={14} /> : <Ban size={14} />}
                </button>
                <button
                  onClick={() => triggerConfirm('Delete Seller', seller, `Soft delete seller profile "${seller.name}"?`, () => handleSoftDeleteSeller(seller))}
                  style={{ padding: 8, background: 'var(--color-danger-light)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--color-danger)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Strip */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {currentPage} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', cursor: 'pointer' }}>Prev</button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', cursor: 'pointer' }}>Next</button>
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
