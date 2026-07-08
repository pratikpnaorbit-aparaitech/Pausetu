import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Clock, Search, Filter, RefreshCw, AlertCircle, Eye, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PendingApprovalsPage() {
  const {
    animals,
    categories,
    isLoading,
    apiError,
    loadDashboardData,
    setDetailsModal,
    setRejectionModal,
    triggerConfirm,
    handleApproveListing
  } = useContext(AdminContext);

  // States for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Pagination page state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. Loading Skeleton States
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.2s' }}>
        <div style={{ height: 40, width: 300, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', gap: 20, backgroundColor: '#fff', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '30%', height: 160, backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-sm)' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ height: 20, width: '40%', backgroundColor: '#f1f5f9', borderRadius: 4 }} />
              <div style={{ height: 40, width: '90%', backgroundColor: '#f1f5f9', borderRadius: 4 }} />
              <div style={{ height: 20, width: '30%', backgroundColor: '#f1f5f9', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Error Fallback Retry Block
  if (apiError) {
    return (
      <div style={{ padding: 40, textAlign: 'center', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 500, margin: '40px auto' }}>
        <AlertCircle size={48} color="var(--color-danger)" />
        <h3 style={{ margin: 0, fontWeight: '700', fontSize: 18, color: 'var(--text-heading)' }}>Connection Error</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Failed to fetch pending approval listings from backend.</p>
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

  // Filter listings by status = pending
  const pendingAnimals = animals.filter((a) => a.status === 'pending' && !a.isDeleted);

  // Apply filters
  const filteredListings = pendingAnimals.filter((animal) => {
    // Search query matches title, breed name, seller name, or village
    const matchesSearch =
      searchQuery.trim() === '' ||
      animal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.village.toLowerCase().includes(searchQuery.toLowerCase());

    // Category matches
    const matchesCategory =
      selectedCategory === '' ||
      animal.categoryId === selectedCategory;

    // District matches
    const matchesDistrict =
      selectedDistrict.trim() === '' ||
      animal.district.toLowerCase().includes(selectedDistrict.toLowerCase());

    // Village matches
    const matchesVillage =
      selectedVillage.trim() === '' ||
      animal.village.toLowerCase().includes(selectedVillage.toLowerCase());

    return matchesSearch && matchesCategory && matchesDistrict && matchesVillage;
  });

  // Pagination calculation
  const totalItems = filteredListings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ animation: 'fadeIn 0.25s' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: '800', color: 'var(--text-heading)', margin: '0 0 4px' }}>Approval Queue</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Review recent livestock submissions before listing them live on the buyer marketplace.</p>
      </div>

      {/* Search & Filter Header layout */}
      <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border-color)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Animal, Breed, Seller, Village..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', height: 40, paddingLeft: 40, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', outline: 'none', fontSize: 13 }}
            />
          </div>
          
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setSelectedDistrict('');
              setSelectedVillage('');
              setCurrentPage(1);
            }}
            style={{ padding: '8px 16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: '600' }}
          >
            Clear Filters
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {/* Category Dropdown filter */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            style={{ height: 38, padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', outline: 'none', minWidth: 160 }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</option>
            ))}
          </select>

          {/* District search input filter */}
          <input
            type="text"
            placeholder="Filter by District"
            value={selectedDistrict}
            onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }}
            style={{ height: 38, padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', outline: 'none', minWidth: 160 }}
          />

          {/* Village search input filter */}
          <input
            type="text"
            placeholder="Filter by Village"
            value={selectedVillage}
            onChange={(e) => { setSelectedVillage(e.target.value); setCurrentPage(1); }}
            style={{ height: 38, padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', outline: 'none', minWidth: 160 }}
          />
        </div>
      </div>

      {/* Main Approval Cards Queue */}
      {paginatedListings.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <CheckCircle2 size={48} color="var(--color-primary)" />
          <h3 style={{ margin: 0, fontWeight: '700', fontSize: 18, color: 'var(--text-heading)' }}>No Pending Approvals</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>All animal listings have been successfully reviewed and released.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {paginatedListings.map((animal) => (
            <div key={animal.id} style={{ display: 'flex', gap: 20, backgroundColor: '#fff', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              {/* Media displays */}
              <div style={{ width: '30%', minWidth: 200, gap: 10, display: 'flex', flexDirection: 'column' }}>
                {animal.photos && animal.photos.length > 0 ? (
                  <img src={animal.photos[0]} style={{ width: '100%', height: 150, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} alt="" />
                ) : (
                  <div style={{ width: '100%', height: 150, borderRadius: 'var(--radius-sm)', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>No Photo</div>
                )}
                {animal.video && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                    <Clock size={14} color="var(--color-primary)" />
                    <span style={{ fontSize: 11, fontWeight: '700', color: 'var(--text-main)' }}>Live Video Attached</span>
                  </div>
                )}
              </div>

              {/* Details details */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: '800', color: 'var(--text-heading)' }}>{animal.title}</h3>
                    <span style={{ fontSize: 18, fontWeight: '900', color: 'var(--color-primary)' }}>₹{animal.price.toLocaleString()}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>{animal.description}</p>
                  
                  {/* Badges traits */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    <span style={{ padding: '4px 10px', backgroundColor: 'var(--color-info-light)', color: 'var(--color-info)', borderRadius: 20, fontSize: 11, fontWeight: '700' }}>Yield: {animal.health?.milkCapacity || 'N/A'}</span>
                    <span style={{ padding: '4px 10px', backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)', borderRadius: 20, fontSize: 11, fontWeight: '700' }}>Pregnant: {animal.health?.pregnant ? 'Yes' : 'No'}</span>
                    <span style={{ padding: '4px 10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 20, fontSize: 11, fontWeight: '700' }}>Vaccinated: {animal.health?.vaccinated ? 'Yes' : 'No'}</span>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
                    <span><strong>Seller:</strong> {animal.sellerName}</span>
                    <span><strong>Location:</strong> {animal.village}, {animal.district}</span>
                  </div>
                </div>

                {/* Card footer buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <button
                    onClick={() => setDetailsModal({ visible: true, data: animal })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: 13
                    }}
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => setRejectionModal({ visible: true, data: animal, reason: '' })}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-danger-light)',
                      color: 'var(--color-danger)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: 13
                    }}
                  >
                    Reject Listing
                  </button>
                  <button
                    onClick={() => triggerConfirm('Approve', animal, `Approve and release "${animal.title}" to public listings?`, () => handleApproveListing(animal))}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: 13
                    }}
                  >
                    Approve & Post
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, backgroundColor: '#fff', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Showing Page {currentPage} of {totalPages} ({totalItems} total approvals)
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: currentPage === 1 ? '#e2e8f0' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: currentPage === totalPages ? '#e2e8f0' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
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
