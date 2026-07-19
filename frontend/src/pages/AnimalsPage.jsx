import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

import { useWebAutoRefresh } from '../hooks/useWebAutoRefresh';
import { REFRESH_EVENTS } from '../services/refreshManager';

// Status badge using design system class
function StatusBadge({ status }) {
  const map = {
    approved: 'badge-approved',
    pending:  'badge-pending',
    rejected: 'badge-rejected',
    sold:     'badge-sold',
    draft:    'badge-blocked',
  };
  return (
    <span className={`badge ${map[status] || 'badge-blocked'}`}>
      {status}
    </span>
  );
}

export default function AnimalsPage() {
  const {
    animals,
    setAnimals,
    columnWidths,
    handleMouseDownResize,
    handleMarkSoldListing,
    triggerConfirm,
    handleSoftDeleteListing,
    showToast,
    loadDashboardData,
  } = useContext(AdminContext);

  useWebAutoRefresh(loadDashboardData, {
    events: [REFRESH_EVENTS.LISTING_CREATED, REFRESH_EVENTS.LISTING_UPDATED, REFRESH_EVENTS.LISTING_DELETED],
    pageKey: 'AnimalsPage'
  });

  const [selectedAnimals, setSelectedAnimals] = useState([]);
  const [currentPage, setCurrentPage]         = useState(1);
  const itemsPerPage = 10;

  const activeAnimals   = animals.filter((a) => !a.isDeleted);
  const totalPages      = Math.ceil(activeAnimals.length / itemsPerPage) || 1;
  const paginatedAnimals = activeAnimals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e) => {
    setSelectedAnimals(e.target.checked ? paginatedAnimals.map((a) => a.id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedAnimals((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleBulkApprove = () => {
    setAnimals((prev) => prev.map((a) => selectedAnimals.includes(a.id) ? { ...a, status: 'approved' } : a));
    showToast(`${selectedAnimals.length} listings approved.`);
    setSelectedAnimals([]);
  };

  const allSelected = paginatedAnimals.length > 0 && paginatedAnimals.every((a) => selectedAnimals.includes(a.id));

  return (
    <div style={{ animation: 'fadeIn 0.22s both' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Animal Listings</h2>
          <p className="page-subtitle">{activeAnimals.length} total active listings</p>
        </div>
        {selectedAnimals.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn 0.15s both' }}>
            <span style={{ fontSize: 13, fontWeight: '600', color: 'var(--text-muted)' }}>
              {selectedAnimals.length} selected
            </span>
            <button className="btn btn-primary btn-sm" onClick={handleBulkApprove}>
              <Check size={13} /> Bulk Approve
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        {activeAnimals.length === 0 ? (
          <div className="empty-state" style={{ border: 'none' }}>
            <div className="empty-state-icon">
              <Trash2 size={24} color="var(--text-muted)" />
            </div>
            <h3 style={{ margin: '0 0 6px', fontWeight: '700', fontSize: 16, color: 'var(--text-heading)' }}>
              No listings yet
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              Animal listings submitted by sellers will appear here.
            </p>
          </div>
        ) : (
          <table className="resizable-table">
            <thead>
              <tr>
                <th style={{ padding: '11px 14px', width: 44 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                    aria-label="Select all"
                  />
                </th>
                <th className="resizable-th" style={{ width: columnWidths.title }}>
                  Title
                  <div className="column-resizer" onMouseDown={(e) => handleMouseDownResize(e, 'title')} />
                </th>
                <th className="resizable-th" style={{ width: columnWidths.category }}>
                  Category
                  <div className="column-resizer" onMouseDown={(e) => handleMouseDownResize(e, 'category')} />
                </th>
                <th className="resizable-th" style={{ width: columnWidths.breed }}>
                  Breed
                  <div className="column-resizer" onMouseDown={(e) => handleMouseDownResize(e, 'breed')} />
                </th>
                <th className="resizable-th" style={{ width: columnWidths.price }}>
                  Price
                  <div className="column-resizer" onMouseDown={(e) => handleMouseDownResize(e, 'price')} />
                </th>
                <th className="resizable-th" style={{ width: columnWidths.status }}>
                  Status
                  <div className="column-resizer" onMouseDown={(e) => handleMouseDownResize(e, 'status')} />
                </th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAnimals.map((a) => (
                <tr key={a.id}>
                  <td style={{ padding: '12px 14px' }}>
                    <input
                      type="checkbox"
                      checked={selectedAnimals.includes(a.id)}
                      onChange={() => handleSelectOne(a.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                      aria-label={`Select ${a.title}`}
                    />
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: 'var(--text-heading)', fontSize: 13 }}>
                      {a.title || '—'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{a.categoryName || 'N/A'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{a.breedName || 'N/A'}</td>
                  <td>
                    <span style={{ fontWeight: '700', fontSize: 13, color: 'var(--text-heading)', fontVariantNumeric: 'tabular-nums' }}>
                      ₹{(a.price || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleMarkSoldListing(a)}
                        className="btn-ghost btn-icon"
                        title="Mark as Sold"
                        aria-label={`Mark ${a.title} as sold`}
                      >
                        <Check size={16} color="var(--color-info)" />
                      </button>
                      <button
                        onClick={() => triggerConfirm(
                          'Soft Delete', a,
                          `Hide "${a.title}" from buyers? The record remains recoverable.`,
                          () => handleSoftDeleteListing(a)
                        )}
                        className="btn-ghost btn-icon"
                        title="Soft Delete"
                        aria-label={`Delete ${a.title}`}
                      >
                        <Trash2 size={16} color="var(--color-danger)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-main)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
