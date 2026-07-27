import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { CheckCircle, ShoppingBag, Search, Download, Printer, ChevronLeft, ChevronRight, X, ArrowLeft, XCircle } from 'lucide-react';

function StatusBadge({ status }) {
  const map = {
    approved: 'badge-approved',
    sold: 'badge-sold',
    rejected: 'badge-rejected',
  };
  return (
    <span className={`badge ${map[status] || 'badge-pending'}`}>
      {status}
    </span>
  );
}

export default function HistoryPage() {
  const { animals, showToast } = useContext(AdminContext);

  const [activeTab, setActiveTab] = useState('cards'); // 'cards', 'approved', 'sold', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [breedFilter, setBreedFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Slices
  const approvedAnimals = animals.filter(a => a.status === 'approved' && !a.isDeleted);
  const soldAnimals = animals.filter(a => a.status === 'sold' && !a.isDeleted);
  const rejectedAnimals = animals.filter(a => a.status === 'rejected' && !a.isDeleted);

  const currentDataset = 
    activeTab === 'approved' ? approvedAnimals : 
    activeTab === 'sold' ? soldAnimals : 
    activeTab === 'rejected' ? rejectedAnimals : [];

  // Filter
  const filteredData = currentDataset.filter(a => {
    const matchesSearch = searchQuery === '' || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.sellerName && a.sellerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.buyerName && a.buyerName.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesDistrict = districtFilter === '' || a.district.toLowerCase().includes(districtFilter.toLowerCase());
    const matchesBreed = breedFilter === '' || a.breedName.toLowerCase().includes(breedFilter.toLowerCase());
    const matchesDate = dateFilter === '' || (a.approvedAt && a.approvedAt.includes(dateFilter)) || (a.updatedAt && a.updatedAt.includes(dateFilter));

    return matchesSearch && matchesDistrict && matchesBreed && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Extract unique filter options
  const uniqueDistricts = [...new Set(currentDataset.map(a => a.district).filter(Boolean))];
  const uniqueBreeds = [...new Set(currentDataset.map(a => a.breedName).filter(Boolean))];

  const resetFilters = () => {
    setSearchQuery('');
    setDistrictFilter('');
    setBreedFilter('');
    setDateFilter('');
    setCurrentPage(1);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    resetFilters();
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }
    
    // Build CSV Header
    let headers = [];
    if (activeTab === 'approved') {
      headers = ['Animal ID', 'Title', 'Breed', 'Seller', 'District', 'Price', 'Approved Date', 'Status'];
    } else if (activeTab === 'rejected') {
      headers = ['Animal ID', 'Title', 'Breed', 'Seller', 'District', 'Price', 'Rejection Reason', 'Status'];
    } else {
      headers = ['Animal ID', 'Title', 'Buyer', 'Seller', 'Sold Price', 'Sold Date', 'District', 'Status'];
    }

    // Build Rows
    const rows = filteredData.map(a => {
      if (activeTab === 'approved') {
        return [
          a.id, `"${a.title}"`, `"${a.breedName}"`, `"${a.sellerName}"`, `"${a.district}"`, a.price, a.approvedAt ? a.approvedAt.split('T')[0] : '', a.status
        ];
      } else if (activeTab === 'rejected') {
        return [
          a.id, `"${a.title}"`, `"${a.breedName}"`, `"${a.sellerName}"`, `"${a.district}"`, a.price, `"${a.rejectionReason || ''}"`, a.status
        ];
      } else {
        return [
          a.id, `"${a.title}"`, `"${a.buyerName || 'Unknown'}"`, `"${a.sellerName}"`, a.soldPrice || a.price, a.updatedAt ? a.updatedAt.split('T')[0] : '', `"${a.district}"`, a.status
        ];
      }
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTab}-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${filteredData.length} records to CSV`, 'success');
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div style={{ animation: 'fadeIn 0.22s both' }}>
      
      {/* ── Cards View ────────────────────────────────────────────── */}
      {activeTab === 'cards' && (
        <>
          <div className="page-header">
            <div>
              <h2 className="page-title">Historical Records</h2>
              <p className="page-subtitle">View and export approved, sold, and rejected listings history.</p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {/* Approved Card */}
            <div className="card" style={{ padding: 24, borderTop: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
                    Approved Animals
                  </h3>
                  <div style={{ fontSize: 36, fontWeight: '800', color: 'var(--text-heading)', marginTop: 8 }}>
                    {approvedAnimals.length}
                  </div>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={24} color="#10b981" />
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                Animals that have passed the verification process and were published to the marketplace.
              </p>
              <button className="btn" style={{ width: '100%', backgroundColor: '#f1f5f9', color: 'var(--text-heading)', border: '1px solid #e2e8f0', justifyContent: 'center' }} onClick={() => switchTab('approved')}>
                View All Approved
              </button>
            </div>

            {/* Sold Card */}
            <div className="card" style={{ padding: 24, borderTop: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
                    Sold Animals
                  </h3>
                  <div style={{ fontSize: 36, fontWeight: '800', color: 'var(--text-heading)', marginTop: 8 }}>
                    {soldAnimals.length}
                  </div>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={24} color="#3b82f6" />
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                Animals that have been successfully sold and marked as completed in the marketplace.
              </p>
              <button className="btn" style={{ width: '100%', backgroundColor: '#f1f5f9', color: 'var(--text-heading)', border: '1px solid #e2e8f0', justifyContent: 'center' }} onClick={() => switchTab('sold')}>
                View All Sold
              </button>
            </div>

            {/* Rejected Card */}
            <div className="card" style={{ padding: 24, borderTop: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
                    Rejected Animals
                  </h3>
                  <div style={{ fontSize: 36, fontWeight: '800', color: 'var(--text-heading)', marginTop: 8 }}>
                    {rejectedAnimals.length}
                  </div>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={24} color="#ef4444" />
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                Animals that did not pass verification along with their rejection reasons.
              </p>
              <button className="btn" style={{ width: '100%', backgroundColor: '#f1f5f9', color: 'var(--text-heading)', border: '1px solid #e2e8f0', justifyContent: 'center' }} onClick={() => switchTab('rejected')}>
                View All Rejected
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Table View ────────────────────────────────────────────── */}
      {activeTab !== 'cards' && (
        <div className="printable-area">
          <div className="page-header print-hide">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => switchTab('cards')}
                  style={{ padding: '6px' }}
                  aria-label="Go back"
                >
                  <ArrowLeft size={16} />
                </button>
                <h2 className="page-title" style={{ margin: 0 }}>
                  {activeTab === 'approved' ? 'Approved History' : activeTab === 'rejected' ? 'Rejected History' : 'Sold History'}
                </h2>
              </div>
              <p className="page-subtitle">{filteredData.length} total records found</p>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
                <Download size={14} /> Export CSV
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>
                <Printer size={14} /> Print PDF
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="card print-hide" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="input-group" style={{ flex: '1 1 200px', minWidth: 200 }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="input-field"
                placeholder="Search by ID, name, seller..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: '2 1 400px' }}>
              <select className="input-field" style={{ flex: 1, minWidth: 120 }} value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)}>
                <option value="">All Districts</option>
                {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {activeTab === 'approved' && (
                <select className="input-field" style={{ flex: 1, minWidth: 120 }} value={breedFilter} onChange={(e) => setBreedFilter(e.target.value)}>
                  <option value="">All Breeds</option>
                  {uniqueBreeds.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}

              <input 
                type="date" 
                className="input-field" 
                style={{ flex: 1, minWidth: 140 }} 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />

              {(searchQuery || districtFilter || breedFilter || dateFilter) && (
                <button className="btn btn-secondary" onClick={resetFilters} title="Clear Filters" style={{ padding: '0 12px' }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            {paginatedData.length === 0 ? (
              <div className="empty-state" style={{ border: 'none' }}>
                <div className="empty-state-icon">
                  <Search size={24} color="var(--text-muted)" />
                </div>
                <h3 style={{ margin: '0 0 6px', fontWeight: '700', fontSize: 16, color: 'var(--text-heading)' }}>
                  No records found
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                  Adjust your search or filter criteria.
                </p>
              </div>
            ) : (
              <table className="resizable-table">
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: 'center' }}>Image</th>
                    <th style={{ width: 100 }}>ID</th>
                    <th>Animal Name</th>
                    {activeTab === 'approved' ? (
                      <>
                        <th>Breed</th>
                        <th>Seller</th>
                        <th>Price</th>
                        <th>Approved Date</th>
                      </>
                    ) : activeTab === 'rejected' ? (
                      <>
                        <th>Breed</th>
                        <th>Seller</th>
                        <th>Price</th>
                        <th>Rejection Reason</th>
                      </>
                    ) : (
                      <>
                        <th>Buyer</th>
                        <th>Seller</th>
                        <th>Sold Price</th>
                        <th>Sold Date</th>
                      </>
                    )}
                    <th>District</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((a) => (
                    <tr key={a.id}>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        {a.photos?.[0] ? (
                          <img src={a.photos[0]} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: '#f1f5f9' }} />
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                        {a.id.slice(-6)}
                      </td>
                      <td style={{ fontWeight: '600' }}>{a.title}</td>
                      
                      {activeTab === 'approved' ? (
                        <>
                          <td>{a.breedName}</td>
                          <td>{a.sellerName}</td>
                          <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>₹{a.price?.toLocaleString()}</td>
                          <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{a.approvedAt ? new Date(a.approvedAt).toLocaleDateString() : '-'}</td>
                        </>
                      ) : activeTab === 'rejected' ? (
                        <>
                          <td>{a.breedName}</td>
                          <td>{a.sellerName}</td>
                          <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>₹{a.price?.toLocaleString()}</td>
                          <td style={{ fontSize: 13, color: 'var(--color-danger)', fontWeight: '600' }}>{a.rejectionReason || 'No reason specified'}</td>
                        </>
                      ) : (
                        <>
                          <td>{a.buyerName || '-'}</td>
                          <td>{a.sellerName}</td>
                          <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>₹{(a.soldPrice || a.price)?.toLocaleString()}</td>
                          <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : '-'}</td>
                        </>
                      )}
                      
                      <td>{a.district}</td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination print-hide" style={{ marginTop: 20 }}>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span style={{ fontSize: 13, fontWeight: '600', color: 'var(--text-muted)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
