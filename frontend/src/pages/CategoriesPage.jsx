import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Edit2, Search, ArrowUpDown, Shield, ShieldAlert, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function CategoriesPage() {
  const {
    categories,
    setCategories,
    showToast
  } = useContext(AdminContext);

  const [catForm, setCatForm] = useState({ id: '', name: '', slug: '', description: '', sortOrder: '', isEdit: false, isActive: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('sortOrder');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!catForm.name || !catForm.slug) {
      showToast('Name and Slug are required', 'error');
      return;
    }
    if (catForm.isEdit) {
      setCategories((prev) => prev.map((c) => c.id === catForm.id || c._id === catForm.id ? { ...catForm, isEdit: false } : c));
      showToast('Category Updated Successfully!');
    } else {
      const newCat = { ...catForm, id: `c_${Date.now()}`, _id: `c_${Date.now()}` };
      setCategories((prev) => [...prev, newCat]);
      showToast('Category Created Successfully!');
    }
    setCatForm({ id: '', name: '', slug: '', description: '', sortOrder: '', isEdit: false, isActive: true });
  };

  const toggleStatus = (cat) => {
    const nextStatus = !cat.isActive;
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id || c._id === cat.id || c._id === cat._id ? { ...c, isActive: nextStatus } : c))
    );
    showToast(`Category status set to ${nextStatus ? 'Enabled' : 'Disabled'}`, 'success');
  };

  const triggerSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtering Logic
  const filtered = categories.filter((c) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === '' ||
      (statusFilter === 'active' && c.isActive) ||
      (statusFilter === 'inactive' && !c.isActive);

    return matchesSearch && matchesStatus;
  });

  // Sorting logic
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'sortOrder') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculation
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', animation: 'fadeIn 0.22s both' }}>
      
      {/* CRUD Listing Grid */}
      <div style={{ flex: '1 1 500px', minWidth: 320 }}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="page-title">Animal Categories</h2>
            <p className="page-subtitle">{categories.length} categories registered</p>
          </div>
        </div>

        {/* Searching & Filter inputs */}
        <div className="filter-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input input-search"
              style={{ paddingLeft: 34 }}
              placeholder="Search category name, slug..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="input"
            style={{ width: 140 }}
          >
            <option value="">All Statuses</option>
            <option value="active">Enabled</option>
            <option value="inactive">Disabled</option>
          </select>
        </div>

        <div className="table-container">
          {paginated.length === 0 ? (
            <div className="empty-state" style={{ border: 'none' }}>
              <div className="empty-state-icon">
                <Search size={24} color="var(--text-muted)" />
              </div>
              <h3 style={{ margin: '0 0 6px', fontWeight: '700', fontSize: 16, color: 'var(--text-heading)' }}>
                No categories found
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                Try adjusting your search query or status filter.
              </p>
            </div>
          ) : (
            <>
              <table className="resizable-table">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => triggerSort('name')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Name <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th>Slug</th>
                    <th style={{ cursor: 'pointer', width: 100 }} onClick={() => triggerSort('sortOrder')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Order <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th style={{ width: 110 }}>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c) => (
                    <tr key={c.id || c._id}>
                      <td>
                        <span style={{ fontWeight: '600', color: 'var(--text-heading)', fontSize: 13.5 }}>{c.name}</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.slug}</td>
                      <td style={{ fontSize: 13, fontWeight: '500' }}>{c.sortOrder}</td>
                      <td>
                        <span className={`badge ${c.isActive ? 'badge-active' : 'badge-blocked'}`}>
                          {c.isActive ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setCatForm({ ...c, id: c.id || c._id, isEdit: true })}
                            className="btn-ghost btn-icon"
                            title="Edit"
                          >
                            <Edit2 size={15} color="var(--color-primary)" />
                          </button>
                          <button
                            onClick={() => toggleStatus(c)}
                            className="btn-ghost btn-icon"
                            title={c.isActive ? 'Disable' : 'Enable'}
                            style={{ color: c.isActive ? 'var(--color-danger)' : 'var(--color-primary)' }}
                          >
                            {c.isActive ? <ShieldAlert size={15} /> : <Shield size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination strip */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-main)', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CRUD Entry form */}
      <form
        onSubmit={handleSaveCategory}
        className="card-flat"
        style={{ width: 300, padding: 22, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: '700', color: 'var(--text-heading)' }}>
          {catForm.isEdit ? 'Edit' : 'Create'} Category
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="input"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              placeholder="e.g. Cow"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Slug</label>
            <input
              type="text"
              className="input"
              value={catForm.slug}
              onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
              placeholder="e.g. cow"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="input"
              style={{ minHeight: 70 }}
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              placeholder="Category details…"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Sort Order</label>
            <input
              type="number"
              className="input"
              value={catForm.sortOrder}
              onChange={(e) => setCatForm({ ...catForm, sortOrder: e.target.value })}
              placeholder="e.g. 1"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
            {catForm.isEdit ? 'Save Changes' : <><Plus size={14} /> Create Category</>}
          </button>
        </div>
      </form>
    </div>
  );
}
