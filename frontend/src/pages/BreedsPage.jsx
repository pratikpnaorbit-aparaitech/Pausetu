import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Edit2, Search, ArrowUpDown, ChevronLeft, ChevronRight, ShieldAlert, Shield, Plus } from 'lucide-react';

export default function BreedsPage() {
  const {
    breeds,
    setBreeds,
    categories,
    showToast
  } = useContext(AdminContext);

  const [breedForm, setBreedForm] = useState({ id: '', categoryId: categories[0]?.id || '1', categoryName: categories[0]?.name || 'Cow', name: '', description: '', isEdit: false, isActive: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleSaveBreed = (e) => {
    e.preventDefault();
    if (!breedForm.name) {
      showToast('Breed Name is required', 'error');
      return;
    }
    const cat = categories.find((c) => c.id === breedForm.categoryId || c._id === breedForm.categoryId) || { name: 'Cow' };
    const payload = { ...breedForm, categoryName: cat.name };

    if (breedForm.isEdit) {
      setBreeds((prev) => prev.map((b) => b.id === breedForm.id || b._id === breedForm.id ? { ...payload, isEdit: false } : b));
      showToast('Breed Updated Successfully!');
    } else {
      const newBreed = { ...payload, id: `b_${Date.now()}`, _id: `b_${Date.now()}` };
      setBreeds((prev) => [...prev, newBreed]);
      showToast('Breed Created Successfully!');
    }
    setBreedForm({ id: '', categoryId: categories[0]?.id || '1', categoryName: categories[0]?.name || 'Cow', name: '', description: '', isEdit: false, isActive: true });
  };

  const toggleStatus = (breed) => {
    const nextStatus = !breed.isActive;
    setBreeds((prev) =>
      prev.map((b) => (b.id === breed.id || b._id === breed.id || b._id === breed._id ? { ...b, isActive: nextStatus } : b))
    );
    showToast(`Breed status set to ${nextStatus ? 'Enabled' : 'Disabled'}`, 'success');
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
  const filtered = breeds.map(b => ({ ...b, isActive: b.isActive !== false })).filter((b) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat =
      selectedCatFilter === '' ||
      b.categoryId === selectedCatFilter;

    return matchesSearch && matchesCat;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    const aVal = String(a[sortField]).toLowerCase();
    const bVal = String(b[sortField]).toLowerCase();
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
      
      {/* Breeds listings table */}
      <div style={{ flex: '1 1 500px', minWidth: 320 }}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="page-title">Animal Breeds</h2>
            <p className="page-subtitle">{breeds.length} breeds registered</p>
          </div>
        </div>

        {/* Searching & Filter strip */}
        <div className="filter-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input input-search"
              style={{ paddingLeft: 34 }}
              placeholder="Search breed name, description..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select
            value={selectedCatFilter}
            onChange={(e) => { setSelectedCatFilter(e.target.value); setCurrentPage(1); }}
            className="input"
            style={{ width: 160 }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="table-container">
          {paginated.length === 0 ? (
            <div className="empty-state" style={{ border: 'none' }}>
              <div className="empty-state-icon">
                <Search size={24} color="var(--text-muted)" />
              </div>
              <h3 style={{ margin: '0 0 6px', fontWeight: '700', fontSize: 16, color: 'var(--text-heading)' }}>
                No breeds found
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                Try adjusting your search criteria or changing category filter.
              </p>
            </div>
          ) : (
            <>
              <table className="resizable-table">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => triggerSort('name')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Breed Name <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => triggerSort('categoryName')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Category <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th>Description</th>
                    <th style={{ width: 110 }}>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((b) => (
                    <tr key={b.id || b._id}>
                      <td>
                        <span style={{ fontWeight: '600', color: 'var(--text-heading)', fontSize: 13.5 }}>{b.name}</span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-main)' }}>{b.categoryName}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{b.description || '—'}</td>
                      <td>
                        <span className={`badge ${b.isActive ? 'badge-active' : 'badge-blocked'}`}>
                          {b.isActive ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setBreedForm({ ...b, id: b.id || b._id, isEdit: true })}
                            className="btn-ghost btn-icon"
                            title="Edit"
                          >
                            <Edit2 size={15} color="var(--color-primary)" />
                          </button>
                          <button
                            onClick={() => toggleStatus(b)}
                            className="btn-ghost btn-icon"
                            title={b.isActive ? 'Disable' : 'Enable'}
                            style={{ color: b.isActive ? 'var(--color-danger)' : 'var(--color-primary)' }}
                          >
                            {b.isActive ? <ShieldAlert size={15} /> : <Shield size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Strip */}
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

      {/* Creation form */}
      <form
        onSubmit={handleSaveBreed}
        className="card-flat"
        style={{ width: 300, padding: 22, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: '700', color: 'var(--text-heading)' }}>
          {breedForm.isEdit ? 'Edit' : 'Create'} Breed
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Breed Name</label>
            <input
              type="text"
              className="input"
              value={breedForm.name}
              onChange={(e) => setBreedForm({ ...breedForm, name: e.target.value })}
              placeholder="e.g. Holstein Friesian"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="input"
              value={breedForm.categoryId}
              onChange={(e) => setBreedForm({ ...breedForm, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="input"
              style={{ minHeight: 80 }}
              value={breedForm.description}
              onChange={(e) => setBreedForm({ ...breedForm, description: e.target.value })}
              placeholder="Breed details and traits…"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
            {breedForm.isEdit ? 'Save Changes' : <><Plus size={14} /> Create Breed</>}
          </button>
        </div>
      </form>
    </div>
  );
}
